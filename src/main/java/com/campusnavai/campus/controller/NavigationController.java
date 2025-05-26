package com.campusnavai.campus.controller;

import com.campusnavai.campus.entity.Node;
import com.campusnavai.campus.service.GraphService;
import com.campusnavai.campus.repository.DatabaseAccess;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class NavigationController {

    @Autowired
    private GraphService graphService;

    @Autowired
    private DatabaseAccess databaseAccess;

    // Debug: Confirm controller is initialized
    public NavigationController() {
        System.out.println("NavigationController initialized");
    }

    @GetMapping("/navigate")
    public ResponseEntity<List<String>> navigate(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "bfs") String algorithm,
            @RequestParam(defaultValue = "deemed") String campus) {
        System.out.println("Received request for /api/navigate with params: from=" + from + ", to=" + to + ", algorithm=" + algorithm + ", campus=" + campus);
        try {
            if (!algorithm.equalsIgnoreCase("bfs") && !algorithm.equalsIgnoreCase("dijkstra")) {
                return ResponseEntity.badRequest().body(List.of("Invalid algorithm. Use 'bfs' or 'dijkstra'."));
            }
            if (!campus.equalsIgnoreCase("deemed") && !campus.equalsIgnoreCase("hill") && !campus.equalsIgnoreCase("outer")) {
                return ResponseEntity.badRequest().body(List.of("Invalid campus. Use 'deemed', 'hill', or 'outer'."));
            }
            List<Node> path = graphService.findShortestPath(from, to, algorithm, campus);
            List<String> pathNames = path.stream()
                    .map(Node::getName)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(pathNames);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(List.of(e.getMessage()));
        }
    }

    @GetMapping("/nodes")
    public ResponseEntity<List<String>> getNodes(@RequestParam String campus) {
        System.out.println("=== /api/nodes Request ===");
        System.out.println("Requested campus: " + campus);
        try {
            if (!campus.equalsIgnoreCase("deemed") && !campus.equalsIgnoreCase("hill") && !campus.equalsIgnoreCase("outer")) {
                System.out.println("Invalid campus name: " + campus);
                return ResponseEntity.badRequest().body(List.of("Invalid campus. Use 'deemed', 'hill', or 'outer'."));
            }
            List<Node> nodes = databaseAccess.findAllNodes(campus);
            System.out.println("Found " + nodes.size() + " nodes for campus: " + campus);
            System.out.println("Node names: " + nodes.stream().map(Node::getName).collect(Collectors.joining(", ")));
            List<String> nodeNames = nodes.stream()
                    .map(Node::getName)
                    .sorted()
                    .collect(Collectors.toList());
            return ResponseEntity.ok(nodeNames);
        } catch (IllegalArgumentException e) {
            System.out.println("Error processing request: " + e.getMessage());
            return ResponseEntity.badRequest().body(List.of(e.getMessage()));
        } catch (Exception e) {
            System.out.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(List.of("An unexpected error occurred"));
        }
    }
}