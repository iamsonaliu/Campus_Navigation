package com.campusnav.service;

import com.campusnav.model.Node;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DatabaseAccess {
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DatabaseAccess(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Node> getNodes(String campus) {
        String tableName = getTableName(campus);
        String sql = String.format("SELECT name, latitude, longitude FROM %s", tableName);
        
        return jdbcTemplate.query(sql, (rs, rowNum) -> 
            new Node(
                rs.getString("name"),
                rs.getDouble("latitude"),
                rs.getDouble("longitude")
            )
        );
    }

    public Map<String, Set<String>> getAdjacencyList(String campus) {
        String tableName = getTableName(campus);
        String sql = String.format("SELECT source, destination FROM %s_edges", tableName);
        
        Map<String, Set<String>> adjacencyList = new HashMap<>();
        
        jdbcTemplate.query(sql, (rs) -> {
            String source = rs.getString("source");
            String destination = rs.getString("destination");
            
            adjacencyList.computeIfAbsent(source, k -> new HashSet<>()).add(destination);
            // For undirected graph, add the reverse edge
            adjacencyList.computeIfAbsent(destination, k -> new HashSet<>()).add(source);
        });
        
        return adjacencyList;
    }

    private String getTableName(String campus) {
        return switch (campus.toLowerCase()) {
            case "deemed" -> "nodes_deemed";
            case "hill" -> "nodes_hill";
            case "outer" -> "nodes_outer";
            default -> throw new IllegalArgumentException("Invalid campus: " + campus);
        };
    }
} 