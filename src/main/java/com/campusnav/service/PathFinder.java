package com.campusnav.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class PathFinder {
    private final DatabaseAccess databaseAccess;

    @Autowired
    public PathFinder(DatabaseAccess databaseAccess) {
        this.databaseAccess = databaseAccess;
    }

    public List<String> findPath(String from, String to, String algorithm, String campus) {
        Map<String, Set<String>> adjacencyList = databaseAccess.getAdjacencyList(campus);
        
        return switch (algorithm.toLowerCase()) {
            case "bfs" -> bfs(from, to, adjacencyList);
            case "dijkstra" -> dijkstra(from, to, adjacencyList);
            default -> throw new IllegalArgumentException("Invalid algorithm: " + algorithm);
        };
    }

    private List<String> bfs(String start, String end, Map<String, Set<String>> adjacencyList) {
        Queue<String> queue = new LinkedList<>();
        Map<String, String> parentMap = new HashMap<>();
        Set<String> visited = new HashSet<>();

        queue.offer(start);
        visited.add(start);

        while (!queue.isEmpty()) {
            String current = queue.poll();

            if (current.equals(end)) {
                return reconstructPath(parentMap, start, end);
            }

            for (String neighbor : adjacencyList.getOrDefault(current, Collections.emptySet())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    parentMap.put(neighbor, current);
                    queue.offer(neighbor);
                }
            }
        }

        return Collections.emptyList();
    }

    private List<String> dijkstra(String start, String end, Map<String, Set<String>> adjacencyList) {
        PriorityQueue<Node> pq = new PriorityQueue<>();
        Map<String, Double> distances = new HashMap<>();
        Map<String, String> parentMap = new HashMap<>();
        Set<String> visited = new HashSet<>();

        // Initialize distances
        for (String node : adjacencyList.keySet()) {
            distances.put(node, Double.POSITIVE_INFINITY);
        }
        distances.put(start, 0.0);
        pq.offer(new Node(start, 0.0));

        while (!pq.isEmpty()) {
            Node current = pq.poll();
            
            if (visited.contains(current.name)) {
                continue;
            }
            
            visited.add(current.name);
            
            if (current.name.equals(end)) {
                return reconstructPath(parentMap, start, end);
            }

            for (String neighbor : adjacencyList.getOrDefault(current.name, Collections.emptySet())) {
                if (!visited.contains(neighbor)) {
                    double newDist = distances.get(current.name) + 1; // Assuming uniform edge weights
                    if (newDist < distances.get(neighbor)) {
                        distances.put(neighbor, newDist);
                        parentMap.put(neighbor, current.name);
                        pq.offer(new Node(neighbor, newDist));
                    }
                }
            }
        }

        return Collections.emptyList();
    }

    private List<String> reconstructPath(Map<String, String> parentMap, String start, String end) {
        List<String> path = new ArrayList<>();
        String current = end;
        
        while (current != null) {
            path.add(0, current);
            current = parentMap.get(current);
        }
        
        return path.get(0).equals(start) ? path : Collections.emptyList();
    }

    private static class Node implements Comparable<Node> {
        String name;
        double distance;

        Node(String name, double distance) {
            this.name = name;
            this.distance = distance;
        }

        @Override
        public int compareTo(Node other) {
            return Double.compare(this.distance, other.distance);
        }
    }
} 