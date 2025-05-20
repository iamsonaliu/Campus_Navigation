package com.campusnavai.campus.repository;

import com.campusnavai.campus.entity.Edge;
import com.campusnavai.campus.entity.Node;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Repository
public class DatabaseAccess {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseAccess.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Node> findAllNodes() {
        try {
            String sql = "SELECT * FROM nodes";
            return jdbcTemplate.query(sql, (rs, rowNum) -> mapRowToNode(rs));
        } catch (DataAccessException e) {
            throw new RuntimeException("Failed to fetch nodes: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("deprecation")
    public Optional<Node> findNodeByName(String name) {
        try {
            String sql = "SELECT * FROM nodes WHERE name = ?";
            List<Node> nodes = jdbcTemplate.query(sql, new Object[]{name}, (rs, rowNum) -> mapRowToNode(rs));
            return nodes.isEmpty() ? Optional.empty() : Optional.of(nodes.get(0));
        } catch (DataAccessException e) {
            throw new RuntimeException("Failed to fetch node by name '" + name + "': " + e.getMessage(), e);
        }
    }

    public List<Edge> findAllEdges() {
        try {
            Map<Long, Node> nodeMap = new HashMap<>();
            findAllNodes().forEach(node -> nodeMap.put(node.getNodeId(), node));
            String sql = "SELECT * FROM edges";
            List<Edge> edges = jdbcTemplate.query(sql, (rs, rowNum) -> {
                Edge edge = new Edge();
                edge.setEdgeId(rs.getLong("edge_id"));
                Long fromNodeId = rs.getLong("from_node");
                Long toNodeId = rs.getLong("to_node");
                Node fromNode = nodeMap.get(fromNodeId);
                Node toNode = nodeMap.get(toNodeId);
                if (fromNode == null || toNode == null) {
                    logger.warn("Skipping invalid edge: from_node={}, to_node={}", fromNodeId, toNodeId);
                    return null; // Skip invalid edges
                }
                edge.setFromNode(fromNode);
                edge.setToNode(toNode);
                edge.setWeight(rs.getDouble("weight"));
                edge.setDescription(rs.getString("description"));
                return edge;
            });
            List<Edge> validEdges = edges.stream().filter(Objects::nonNull).toList();
            logger.info("Loaded {} valid edges", validEdges.size());
            return validEdges;
        } catch (DataAccessException e) {
            throw new RuntimeException("Failed to fetch edges: " + e.getMessage(), e);
        }
    }

    private Node mapRowToNode(ResultSet rs) throws SQLException {
        Node node = new Node();
        node.setNodeId(rs.getLong("node_id"));
        node.setName(rs.getString("name"));
        node.setDescription(rs.getString("description"));
        node.setType(rs.getString("type"));
        node.setLatitude(rs.getDouble("latitude"));
        if (rs.wasNull()) node.setLatitude(null);
        node.setLongitude(rs.getDouble("longitude"));
        if (rs.wasNull()) node.setLongitude(null);
        return node;
    }
}