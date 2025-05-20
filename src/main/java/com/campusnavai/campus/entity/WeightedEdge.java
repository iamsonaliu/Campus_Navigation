package com.campusnavai.campus.entity;

public class WeightedEdge {
    private final Node target;
    private final double weight;

    public WeightedEdge(Node target, double weight) {
        this.target = target;
        this.weight = weight;
    }

    public Node getTarget() {
        return target;
    }

    public double getWeight() {
        return weight;
    }
}