package com.friendprep.backend.controller;

import com.friendprep.backend.service.OllamaService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final OllamaService ollamaService;

    public ProjectController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    @PostMapping("/generate")
    public String generateProjects(@RequestBody Map<String, String> request) {

        String branch = request.get("branch");
        String skills = request.get("skills");
        String level = request.get("level");
        String careerGoal = request.get("careerGoal");
        String timeAvailable = request.get("timeAvailable");

        return ollamaService.generateProjectIdeas(
                branch,
                skills,
                level,
                careerGoal,
                timeAvailable
        );
    }
}