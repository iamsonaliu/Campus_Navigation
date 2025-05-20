package com.campusnavai.campus.entity;

public class Edge {
    private Long edgeId;
    private Node fromNode;
    private Node toNode;
    private double weight;
    private String description;

    // Default constructor
    public Edge() {
    }

    // Getters
    public Long getEdgeId() {
        return edgeId;
    }

    public Node getFromNode() {
        return fromNode;
    }

    public Node getToNode() {
        return toNode;
    }

    public double getWeight() {
        return weight;
    }

    public String getDescription() {
        return description;
    }

    // Setters
    public void setEdgeId(Long edgeId) {
        this.edgeId = edgeId;
    }

    public void setFromNode(Node fromNode) {
        this.fromNode = fromNode;
    }

    public void setToNode(Node toNode) {
        this.toNode = toNode;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}