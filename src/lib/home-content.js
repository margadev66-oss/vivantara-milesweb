const DEFAULT_HOME_CONTENT = {
  hero: {
    title: "Pressure doesn't break organisations. It reveals misalignment.",
    body_1: "Find clarity. Build alignment. Gain fortitude.",
    body_2: "",
    button_label: "Start a Conversation",
  },
  who_we_are: {
    eyebrow: "Who We Are",
    title: "A transformation partner for organisations navigating uncertainty.",
    body_1:
      "Vivartana is a transformation partner for organisations navigating uncertainty, disruption, and constant change.",
    body_2:
      "Vivartana works at the intersection of leadership, quality management, and organisational behaviour to help organisations build the internal coherence required to perform when tested.",
  },
  what_we_do: {
    eyebrow: "What We Do",
    title: "Strengthening the dimensions that determine response under pressure.",
    intro:
      "Vivartana works on the underlying organisational dimensions that determine how people sense, interpret, coordinate, and hold together under pressure.",
    focus_title: "This includes working on",
    focus_areas: [
      "How teams perceive and interpret emerging challenges",
      "How people coordinate under ambiguity",
      "How leadership behaviour shapes organisational response",
      "How roles align with cognitive strengths",
      "How Cognitive Diversity and Neurodiversity become performance assets",
      "How the organisation holds together under stress",
    ],
  },
  why_this_matters: {
    eyebrow: "Why This Matters",
    title: "Pressure exposes where response systems break down.",
    intro: "When organisations are under pressure:",
    pressure_signals: [
      "Capable people appear to underperform",
      "Teams miscommunicate",
      "Decision quality drops",
      "Leadership intent does not translate into behaviour",
      "Valuable cognitive strengths go unnoticed",
    ],
    closing: "These are not culture issues. They are Organisational Stress Response issues.",
  },
  how_we_work: {
    eyebrow: "How We Work",
    title: "A structured, iterative workflow for stronger organisational response.",
    intro:
      "Vivartana follows a structured, iterative workflow to progressively strengthen organisational stress response.",
    steps: [
      {
        title: "ORI Scan™",
        description:
          "A proprietary diagnostic exercise to understand how the organisation actually behaves under pressure through structured conversations and observations.",
      },
      {
        title: "Roadmap",
        description:
          "Insights from the ORI Scan™ are translated into practical focus areas involving leadership behaviour, role design, Cognitive Diversity and Neurodiversity, and psychosocial alignment.",
      },
      {
        title: "Transformation Engagement",
        description:
          "Vivartana partners with organisations over time to strengthen how people sense, interpret, coordinate, and hold together when tested.",
      },
    ],
    cycle_title: "The Iterative Cycle",
    cycle_stages: ["Scan", "Interpret", "Strengthen", "Re-Scan"],
    cycle_body:
      "At any point, the organisation operates at a certain level of maturity known as its Organisational Operating System (OOS™). As successive cycles strengthen the OOS™, the organisation's Antifragility Achievement Index (AAI™) improves, indicating a growing ability to function coherently and grow stronger through stress and disruption.",
  },
  about_founder: {
    eyebrow: "About the Founder",
    title: "Aumlan Guha",
    body_1:
      "Aumlan Guha brings together a rare mix of engineering, quality leadership, and a deep interest in human behaviour to understand organisations in a way few practitioners do. Over two decades in software delivery excellence placed him in environments where performance under pressure was a lived reality. In those moments, he observed a consistent pattern: When things went wrong, processes did not fail first. Alignment did. This led him to look beyond metrics and into the behavioural and structural properties that shape how organisations respond to stress.",
    body_2:
      "His postgraduate studies in Human Resource Management introduced him to the behavioural side of organisations. His long years in industry grounded this understanding in practice. His later academic work in Quality Management, along with ongoing training in Neuro-Linguistic Programming, strengthened both the systems and human lens of his approach. His doctoral research into organisational antifragility now adds a scholarly layer to these lived observations. Through Vivartana, Aumlan works at the intersection of systems, behaviour, leadership intent, and organisational response under pressure - helping leaders, teams, and organisations realign when it matters most.",
  },
  trust_markers: {
    eyebrow: "Trust Markers",
    title: "Depth of practice and research grounding.",
    link_label: "Explore knowledge assets",
    items: [
      {
        title: "Deep roots in complex delivery ecosystems",
        description:
          "Experience spanning leadership responsibility, critical delivery mandates, and execution across complex organisational environments.",
      },
      {
        title: "Formal grounding in systems, quality, and human behaviour",
        description:
          "Academic foundations that integrate systems thinking, quality principles, and the behavioural dynamics of organisations.",
      },
      {
        title: "Ongoing doctoral research into organisational antifragility",
        description:
          "Ongoing doctoral inquiry into how organisations adapt, evolve, and grow stronger through uncertainty and disruption.",
      },
      {
        title: "Applied transformation across complex organisational settings",
        description:
          "Transformation work across varied contexts where alignment, culture, and performance under pressure were critical.",
      },
    ],
    insights_title: "More Resources",
    insights_link_label: "More Resources",
  },
  cta: {
    title: "Curious about how your organisation truly responds when tested?",
    button_label: "Start a Conversation",
  },
};

function mergeHomeContent(overrides) {
  const safe = overrides ?? {};

  return {
    ...DEFAULT_HOME_CONTENT,
    ...safe,
    hero: {
      ...DEFAULT_HOME_CONTENT.hero,
      ...safe.hero,
    },
    who_we_are: {
      ...DEFAULT_HOME_CONTENT.who_we_are,
      ...safe.who_we_are,
    },
    what_we_do: {
      ...DEFAULT_HOME_CONTENT.what_we_do,
      ...safe.what_we_do,
      focus_areas:
        Array.isArray(safe.what_we_do?.focus_areas) && safe.what_we_do.focus_areas.length
          ? safe.what_we_do.focus_areas
          : DEFAULT_HOME_CONTENT.what_we_do.focus_areas,
    },
    why_this_matters: {
      ...DEFAULT_HOME_CONTENT.why_this_matters,
      ...safe.why_this_matters,
      pressure_signals:
        Array.isArray(safe.why_this_matters?.pressure_signals) &&
        safe.why_this_matters.pressure_signals.length
          ? safe.why_this_matters.pressure_signals
          : DEFAULT_HOME_CONTENT.why_this_matters.pressure_signals,
    },
    how_we_work: {
      ...DEFAULT_HOME_CONTENT.how_we_work,
      ...safe.how_we_work,
      steps:
        Array.isArray(safe.how_we_work?.steps) && safe.how_we_work.steps.length
          ? safe.how_we_work.steps
          : DEFAULT_HOME_CONTENT.how_we_work.steps,
      cycle_stages:
        Array.isArray(safe.how_we_work?.cycle_stages) && safe.how_we_work.cycle_stages.length
          ? safe.how_we_work.cycle_stages
          : DEFAULT_HOME_CONTENT.how_we_work.cycle_stages,
    },
    about_founder: {
      ...DEFAULT_HOME_CONTENT.about_founder,
      ...safe.about_founder,
    },
    trust_markers: {
      ...DEFAULT_HOME_CONTENT.trust_markers,
      ...safe.trust_markers,
      items:
        Array.isArray(safe.trust_markers?.items) && safe.trust_markers.items.length
          ? safe.trust_markers.items
          : DEFAULT_HOME_CONTENT.trust_markers.items,
    },
    cta: {
      ...DEFAULT_HOME_CONTENT.cta,
      ...safe.cta,
    },
  };
}

module.exports = { DEFAULT_HOME_CONTENT, mergeHomeContent };
