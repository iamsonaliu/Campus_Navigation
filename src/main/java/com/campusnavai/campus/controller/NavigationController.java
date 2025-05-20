package com.campusnavai.campus.controller;

import com.campusnavai.campus.entity.Node;
import com.campusnavai.campus.service.GraphService;
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

    @GetMapping("/navigate")
    public ResponseEntity<List<String>> navigate(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "bfs") String algorithm) {
        try {
            if (!algorithm.equalsIgnoreCase("bfs") && !algorithm.equalsIgnoreCase("dijkstra")) {
                return ResponseEntity.badRequest().body(List.of("Invalid algorithm. Use 'bfs' or 'dijkstra'."));
            }
            List<Node> path = graphService.findShortestPath(from, to, algorithm);
            List<String> pathNames = path.stream()
                    .map(Node::getName)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(pathNames);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(List.of(e.getMessage()));
        }
    }
}