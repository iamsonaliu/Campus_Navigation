package com.campusnavai.campus.service;

import com.campusnavai.campus.entity.Edge;
import com.campusnavai.campus.entity.Node;
import com.campusnavai.campus.entity.WeightedEdge;
import com.campusnavai.campus.repository.DatabaseAccess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.*;

@Service
public class GraphService {
    private static final Logger logger = LoggerFactory.getLogger(GraphService.class);

    @Autowired
    private DatabaseAccess databaseAccess;

    private Map<Node, List<WeightedEdge>> weightedGraph;

    @PostConstruct
    public void init() {
        logger.info("Starting graph initialization");
        try {
            weightedGraph = buildWeightedGraph();
            if (weightedGraph.isEmpty()) {
                logger.warn("Weighted graph is empty after initialization");
            } else {
                logger.info("Graph initialized with {} nodes", weightedGraph.size());
            }
        } catch (Exception e) {
            logger.error("Failed to initialize weighted graph: {}", e.getMessage(), e);
            weightedGraph = new HashMap<>(); // Fallback to empty graph
        }
    }

    private Map<Node, List<WeightedEdge>> buildWeightedGraph() {
        logger.info("Building weighted graph");
        Map<Node, List<WeightedEdge>> graph = new HashMap<>();
        List<Node> nodes = databaseAccess.findAllNodes();
        logger.debug("Found {} nodes", nodes.size());
        for (Node node : nodes) {
            graph.putIfAbsent(node, new ArrayList<>());
        }
        List<Edge> edges = databaseAccess.findAllEdges();
        logger.debug("Found {} edges", edges.size());
        for (Edge edge : edges) {
            Node fromNode = edge.getFromNode();
            Node toNode = edge.getToNode();
            if (fromNode == null || toNode == null) {
                logger.warn("Skipping invalid edge: fromNodeId={}, toNodeId={}", 
                    edge.getFromNode() != null ? edge.getFromNode().getNodeId() : "null", 
                    edge.getToNode() != null ? edge.getToNode().getNodeId() : "null");
                continue;
            }
            double weight = edge.getWeight();
            graph.computeIfAbsent(fromNode, k -> new ArrayList<>()).add(new WeightedEdge(toNode, weight));
            graph.computeIfAbsent(toNode, k -> new ArrayList<>()).add(new WeightedEdge(fromNode, weight));
            logger.debug("Added edge: {} -> {} (weight: {})", fromNode.getName(), toNode.getName(), weight);
        }
        return graph;
    }

    public void rebuildGraph() {
        logger.info("Rebuilding graph on demand");
        weightedGraph = buildWeightedGraph();
    }

    public List<Node> findShortestPath(String startLocation, String endLocation, String algorithm) {
        logger.info("Finding shortest path from {} to {} using {}", startLocation, endLocation, algorithm);
        rebuildGraph(); // Ensure latest edges are loaded
        if (weightedGraph == null) {
            throw new IllegalStateException("Graph is not initialized");
        }
        Optional<Node> startNodeOpt = databaseAccess.findNodeByName(startLocation);
        Optional<Node> endNodeOpt = databaseAccess.findNodeByName(endLocation);
        if (startNodeOpt.isEmpty()) {
            throw new IllegalArgumentException("Start location not found: " + startLocation);
        }
        if (endNodeOpt.isEmpty()) {
            throw new IllegalArgumentException("End location not found: " + endLocation);
        }
        Node startNode = startNodeOpt.get();
        Node endNode = endNodeOpt.get();
        if ("dijkstra".equalsIgnoreCase(algorithm)) {
            return findShortestPathDijkstra(startNode, endNode, weightedGraph);
        } else if ("bfs".equalsIgnoreCase(algorithm)) {
            return findShortestPathBFS(startNode, endNode, weightedGraph);
        } else {
            throw new IllegalArgumentException("Invalid algorithm. Use 'bfs' or 'dijkstra'.");
        }
    }

    private List<Node> findShortestPathBFS(Node startNode, Node endNode, Map<Node, List<WeightedEdge>> weightedGraph) {
        Map<Node, Node> parentMap = new HashMap<>();
        Queue<Node> queue = new LinkedList<>();
        Set<Node> visited = new HashSet<>();

        queue.add(startNode);
        visited.add(startNode);
        parentMap.put(startNode, null);
        logger.debug("Starting BFS from node: {} (id: {})", startNode.getName(), startNode.getNodeId());

        while (!queue.isEmpty()) {
            Node current = queue.poll();
            logger.debug("Visiting node: {} (id: {})", current.getName(), current.getNodeId());
            if (current.equals(endNode)) {
                logger.debug("Found end node: {} (id: {})", endNode.getName(), endNode.getNodeId());
                break;
            }
            List<WeightedEdge> edgeList = weightedGraph.getOrDefault(current, new ArrayList<>());
            logger.debug("Node {} has {} neighbors", current.getName(), edgeList.size());
            List<Node> neighbors = edgeList.stream()
                    .map(WeightedEdge::getTarget)
                    .filter(Objects::nonNull)
                    .toList();
            for (Node neighbor : neighbors) {
                if (!visited.contains(neighbor)) {
                    logger.debug("Adding neighbor: {} (id: {})", neighbor.getName(), neighbor.getNodeId());
                    visited.add(neighbor);
                    queue.add(neighbor);
                    parentMap.put(neighbor, current);
                }
            }
        }

        if (!parentMap.containsKey(endNode)) {
            logger.warn("No path found between {} (id: {}) and {} (id: {})", 
                startNode.getName(), startNode.getNodeId(), endNode.getName(), endNode.getNodeId());
            throw new IllegalArgumentException("No path exists between " + startNode.getName() + " and " + endNode.getName());
        }

        List<Node> path = new ArrayList<>();
        Node current = endNode;
        while (current != null) {
            path.add(current);
            current = parentMap.get(current);
        }
        Collections.reverse(path);
        logger.info("Path found: {}", path.stream().map(Node::getName).toList());
        return path;
    }

    private List<Node> findShortestPathDijkstra(Node startNode, Node endNode, Map<Node, List<WeightedEdge>> weightedGraph) {
        Map<Node, Double> distances = new HashMap<>();
        Map<Node, Node> parentMap = new HashMap<>();
        PriorityQueue<NodeDistance> priorityQueue = new PriorityQueue<>(Comparator.comparingDouble(NodeDistance::distance));
        Set<Node> visited = new HashSet<>();

        for (Node node : weightedGraph.keySet()) {
            distances.put(node, Double.POSITIVE_INFINITY);
        }
        distances.put(startNode, 0.0);
        priorityQueue.add(new NodeDistance(startNode, 0.0));

        while (!priorityQueue.isEmpty()) {
            Node current = priorityQueue.poll().node();
            if (visited.contains(current)) continue;
            visited.add(current);

            if (current.equals(endNode)) break;

            List<WeightedEdge> edgeList = weightedGraph.getOrDefault(current, new ArrayList<>());
            for (WeightedEdge edge : edgeList) {
                Node neighbor = edge.getTarget();
                if (neighbor == null) continue;
                double newDistance = distances.get(current) + edge.getWeight();
                if (newDistance < distances.getOrDefault(neighbor, Double.POSITIVE_INFINITY)) {
                    distances.put(neighbor, newDistance);
                    parentMap.put(neighbor, current);
                    priorityQueue.add(new NodeDistance(neighbor, newDistance));
                }
            }
        }

        if (!parentMap.containsKey(endNode) && !startNode.equals(endNode)) {
            throw new IllegalArgumentException("No path exists between " + startNode.getName() + " and " + endNode.getName());
        }

        List<Node> path = new ArrayList<>();
        Node current = endNode;
        while (current != null) {
            path.add(current);
            current = parentMap.get(current);
        }
        Collections.reverse(path);
        return path;
    }

    private record NodeDistance(Node node, double distance) {
    }
}