import { useState } from "react";
import "./App.css";

/* =========================================================
   Clean AI text
   ========================================================= */

function cleanText(text) {
  if (!text) return "";

  return text
    .replace(/\*\*/g, "")
    .replace(/\r/g, "")
    .trim();
}


/* =========================================================
   Extract a section from numbered AI response
   ========================================================= */

function extractSection(text, startNumber, nextNumber) {
  if (!text) return "";

  const startRegex = new RegExp(
    `${startNumber}\\.\\s*(?:\\*\\*)?[^\\n]+(?:\\*\\*)?\\s*:?`,
    "i"
  );

  const startMatch = text.match(startRegex);

  if (!startMatch) return "";

  const startIndex = startMatch.index + startMatch[0].length;

  let endIndex = text.length;

  if (nextNumber) {
    const nextRegex = new RegExp(
      `${nextNumber}\\.\\s*`,
      "i"
    );

    const nextMatch = text
      .slice(startIndex)
      .match(nextRegex);

    if (nextMatch) {
      endIndex = startIndex + nextMatch.index;
    }
  }

  return cleanText(
    text.slice(startIndex, endIndex)
  );
}


/* =========================================================
   Parse old numbered Qwen response
   ========================================================= */

function parseOldProject(text) {
  if (!text) return null;

  const titleMatch = text.match(
    /1\.\s*(?:\*\*)?Project Title:?\s*(?:\*\*)?\s*"?(.*?)"?\s*(?:\*\*)?\s*$/im
  );

  const title =
    titleMatch?.[1]?.replace(/\*\*/g, "").trim() ||
    "Recommended Project";


  const problem = extractSection(
    text,
    2,
    3
  );

  const solution = extractSection(
    text,
    3,
    4
  );

  const technologies = extractSection(
    text,
    4,
    5
  );

  const features = extractSection(
    text,
    5,
    6
  );

  const concepts = extractSection(
    text,
    6,
    7
  );

  const difficulty = extractSection(
    text,
    7,
    8
  );

  const time = extractSection(
    text,
    8,
    9
  );

  const meaningful = extractSection(
    text,
    9,
    10
  );

  const resume = extractSection(
    text,
    10,
    null
  );


  return {
    title,
    category: "Domain Project",
    difficulty,
    time,
    problem,
    solution,
    technologies,
    features,
    concepts,
    meaningful,
    resume,
  };
}


/* =========================================================
   Parse AI response
   ========================================================= */

function parseProjects(text) {
  if (!text) return [];

  /*
     First try the new structured format:
     PROJECT 1
     TITLE:
     CATEGORY:
     ...
  */

  const structuredBlocks = text.split(
    /(?=PROJECT\s*[123]\s*)/i
  );

  const structuredProjects = structuredBlocks
    .filter((block) =>
      /PROJECT\s*[123]/i.test(block) &&
      /TITLE\s*:/i.test(block)
    )
    .map((block, index) => {

      const getField = (label) => {

        const regex = new RegExp(
          `${label}\\s*:\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z /_-]+\\s*:|$)`,
          "i"
        );

        const match = block.match(regex);

        return match
          ? cleanText(match[1])
          : "";
      };


      return {
        number: index + 1,

        title:
          getField("TITLE") ||
          `Project ${index + 1}`,

        category:
          getField("CATEGORY") ||
          "Domain Project",

        difficulty:
          getField("DIFFICULTY") ||
          "Intermediate",

        problem:
          getField("REAL-WORLD PROBLEM"),

        solution:
          getField("PROPOSED SOLUTION"),

        match:
          getField(
            "WHY IT MATCHES THIS STUDENT"
          ),

        technologies:
          getField(
            "TECHNOLOGIES / TOOLS"
          ),

        features:
          getField(
            "MAIN FEATURES / COMPONENTS"
          ),

        concepts:
          getField(
            "TECHNICAL CONCEPTS INVOLVED"
          ),

        plan:
          getField(
            "IMPLEMENTATION PLAN"
          ),

        outcome:
          getField(
            "EXPECTED TECHNICAL OUTCOME"
          ),

        resume:
          getField(
            "RESUME DESCRIPTION"
          ),

        stronger:
          getField(
            "HOW TO MAKE IT STRONGER"
          ),
      };
    });


  if (structuredProjects.length > 0) {
    return structuredProjects;
  }


  /*
     Fallback for the current Qwen format.

     Current response may contain:

     1. Project Title
     2. Real-world problem
     3. Proposed solution
     4. Technologies
     ...
  */

  const projectBlocks = text.split(
    /(?=1\.\s*(?:\*\*)?Project Title)/i
  );

  const oldProjects = projectBlocks
    .filter((block) =>
      /Project Title/i.test(block)
    )
    .map((block, index) => {

      const project = parseOldProject(
        block
      );

      if (!project) return null;

      return {
        number: index + 1,
        ...project,
      };
    })
    .filter(Boolean);


  return oldProjects;
}


/* =========================================================
   Format bullet/list text
   ========================================================= */

function FormattedText({ text }) {

  if (!text) return null;

  const cleaned = cleanText(text);

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);


  return (
    <div className="formatted-text">

      {lines.map((line, index) => {

        const isBullet =
          line.startsWith("-") ||
          line.startsWith("•") ||
          line.startsWith("*");

        if (isBullet) {

          return (
            <div
              className="bullet-line"
              key={index}
            >
              <span>•</span>
              <span>
                {line
                  .replace(/^[-•*]\s*/, "")
                  .trim()}
              </span>
            </div>
          );
        }


        return (
          <p key={index}>
            {line}
          </p>
        );

      })}

    </div>
  );
}


/* =========================================================
   Project Card
   ========================================================= */

function ProjectCard({ project }) {

  return (

    <article className="project-card">

      {/* Header */}

      <div className="project-top">

        <span className="project-number">
          PROJECT {project.number}
        </span>

        <div className="project-tags">

          <span className="tag">
            {project.category}
          </span>

          {project.difficulty && (
            <span className="tag difficulty">
              {project.difficulty}
            </span>
          )}

        </div>

      </div>


      {/* Title */}

      <h3>
        {project.title}
      </h3>


      {/* Meta */}

      <div className="project-meta">

        {project.category && (
          <div>

            <span>🏷️</span>

            <div>
              <strong>
                Category
              </strong>

              <p>
                {project.category}
              </p>
            </div>

          </div>
        )}


        {project.difficulty && (
          <div>

            <span>📊</span>

            <div>
              <strong>
                Difficulty
              </strong>

              <p>
                {project.difficulty}
              </p>
            </div>

          </div>
        )}


        {project.time && (
          <div>

            <span>⏱️</span>

            <div>
              <strong>
                Estimated Time
              </strong>

              <p>
                {project.time}
              </p>
            </div>

          </div>
        )}

      </div>


      {/* Problem */}

      {project.problem && (

        <div className="project-section">

          <h4>
            🎯 Real-world problem
          </h4>

          <FormattedText
            text={project.problem}
          />

        </div>

      )}


      {/* Solution */}

      {project.solution && (

        <div className="project-section">

          <h4>
            💡 Proposed solution
          </h4>

          <FormattedText
            text={project.solution}
          />

        </div>

      )}


      {/* Technologies */}

      {project.technologies && (

        <div className="project-section">

          <h4>
            🛠️ Technologies / Tools
          </h4>

          <FormattedText
            text={project.technologies}
          />

        </div>

      )}


      {/* Features */}

      {project.features && (

        <div className="project-section">

          <h4>
            📌 Main features
          </h4>

          <FormattedText
            text={project.features}
          />

        </div>

      )}


      {/* Concepts */}

      {project.concepts && (

        <div className="project-section">

          <h4>
            🧠 Technical concepts
          </h4>

          <FormattedText
            text={project.concepts}
          />

        </div>

      )}


      {/* Why this project */}

      {project.meaningful && (

        <div className="project-section highlight">

          <h4>
            ✨ Why this project is meaningful
          </h4>

          <FormattedText
            text={project.meaningful}
          />

        </div>

      )}


      {/* Match */}

      {project.match && (

        <div className="project-section highlight">

          <h4>
            👤 Why this matches you
          </h4>

          <FormattedText
            text={project.match}
          />

        </div>

      )}


      {/* Resume */}

      {project.resume && (

        <div className="resume-box">

          <h4>
            📄 Resume description
          </h4>

          <FormattedText
            text={project.resume}
          />

        </div>

      )}


      {/* Stronger */}

      {project.stronger && (

        <div className="stronger-box">

          <h4>
            🚀 How to make it stronger
          </h4>

          <FormattedText
            text={project.stronger}
          />

        </div>

      )}

    </article>
  );
}


/* =========================================================
   Main App
   ========================================================= */

function App() {

  const [form, setForm] = useState({
    branch: "",
    skills: "",
    level: "Beginner",
    careerGoal: "",
    timeAvailable: "",
  });


  const [result, setResult] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* Handle input */

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

  };


  /* Generate projects */

  const generateProjects = async () => {

    setResult("");
    setError("");


    if (
      !form.branch.trim() ||
      !form.skills.trim() ||
      !form.careerGoal.trim() ||
      !form.timeAvailable.trim()
    ) {

      setError(
        "Please fill in all the fields before generating projects."
      );

      return;
    }


    setLoading(true);


    try {

      const response = await fetch(
        "/api/projects/generate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(form),
        }
      );


      if (!response.ok) {

        throw new Error(
          `Server returned ${response.status}`
        );

      }


      const data =
        await response.text();


      if (!data.trim()) {

        throw new Error(
          "Empty AI response"
        );

      }


      setResult(data);

    } catch (err) {

      console.error(
        "ResumeForge error:",
        err
      );

      setError(
        "Unable to connect to ResumeForge AI. Make sure Spring Boot and Ollama are running."
      );

    } finally {

      setLoading(false);

    }

  };


  const projects =
    parseProjects(result);


  return (

    <div className="app">

      {/* HERO */}

      <header className="hero">

        <div className="badge">
          AI PROJECT ADVISOR
        </div>

        <h1>
          Resume<span>Forge</span> AI
        </h1>

        <p>
          Find the right project for your
          skills, career goals and available time.
        </p>

      </header>


      {/* MAIN */}

      <main className="container">

        {/* FORM */}

        <section className="card">

          <h2>
            Tell us about yourself
          </h2>

          <p className="subtitle">
            Give us a few details and our local
            AI will suggest personalized project ideas.
          </p>


          <div className="form-grid">

            <div className="form-group">

              <label>
                Branch / Domain
              </label>

              <input
                type="text"
                name="branch"
                placeholder="e.g. Mechanical Engineering"
                value={form.branch}
                onChange={handleChange}
              />

            </div>


            <div className="form-group">

              <label>
                Experience Level
              </label>

              <select
                name="level"
                value={form.level}
                onChange={handleChange}
              >

                <option>
                  Beginner
                </option>

                <option>
                  Intermediate
                </option>

                <option>
                  Advanced
                </option>

              </select>

            </div>


            <div className="form-group full">

              <label>
                Your Skills
              </label>

              <input
                type="text"
                name="skills"
                placeholder="e.g. SolidWorks, AutoCAD, MATLAB"
                value={form.skills}
                onChange={handleChange}
              />

            </div>


            <div className="form-group">

              <label>
                Career Goal
              </label>

              <input
                type="text"
                name="careerGoal"
                placeholder="e.g. Automotive Engineering"
                value={form.careerGoal}
                onChange={handleChange}
              />

            </div>


            <div className="form-group">

              <label>
                Available Time
              </label>

              <input
                type="text"
                name="timeAvailable"
                placeholder="e.g. 4 weeks"
                value={form.timeAvailable}
                onChange={handleChange}
              />

            </div>

          </div>


          <button
            className="generate-btn"
            onClick={generateProjects}
            disabled={loading}
          >

            {loading
              ? "Generating your projects..."
              : "✨ Generate My Projects"}

          </button>


          {error && (

            <div className="error">
              {error}
            </div>

          )}

        </section>


        {/* RESULTS */}

        {result && (

          <section className="results">

            <div className="results-header">

              <div className="badge">
                AI RECOMMENDATIONS
              </div>

              <h2>
                Projects for you
              </h2>

              <p className="results-subtitle">
                Personalized project ideas based on
                your branch, skills, career goal and
                available time.
              </p>

            </div>


            <div className="projects-container">

              {projects.length > 0 ? (

                projects.map(
                  (project) => (

                    <ProjectCard
                      key={project.number}
                      project={project}
                    />

                  )
                )

              ) : (

                <div className="ai-response">
                  {cleanText(result)}
                </div>

              )}

            </div>

          </section>

        )}

      </main>


      <footer>

        <p>
          ResumeForge AI · Powered by open-weight AI
          running locally
        </p>

      </footer>

    </div>

  );
}


export default App;