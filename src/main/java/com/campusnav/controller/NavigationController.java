package com.campusnav.controller;

import com.campusnav.model.Node;
import com.campusnav.service.DatabaseAccess;
import com.campusnav.service.PathFinder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class NavigationController {
    private final DatabaseAccess databaseAccess;
    private final PathFinder pathFinder;

    @Autowired
    public NavigationController(DatabaseAccess databaseAccess, PathFinder pathFinder) {
        this.databaseAccess = databaseAccess;
        this.pathFinder = pathFinder;
    }

    @GetMapping("/nodes")
    public ResponseEntity<List<Node>> getNodes(@RequestParam String campus) {
        try {
            List<Node> nodes = databaseAccess.getNodes(campus);
            return ResponseEntity.ok(nodes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/navigate")
    public ResponseEntity<List<String>> findPath(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam String algorithm,
            @RequestParam String campus) {
        try {
            List<String> path = pathFinder.findPath(from, to, algorithm, campus);
            return ResponseEntity.ok(path);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 