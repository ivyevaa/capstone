def generate_career_guidance(o, c, e, a, n):
    """
    Advanced Profile Analyzer: Translates raw OCEAN scores into 
    deep workplace environmental fit assessments.
    """
    analysis = []

    # 1. Execution & Task Style (Conscientiousness + Openness)
    if c >= 0.6 and o >= 0.6:
        analysis.append("STRATEGIC ARCHITECT PROFILE: You combine high operational discipline with creative conceptualization. You don't just dream up ideas; you build the systems to execute them. You are optimized for technical leadership, product architecture, or high-level research and development fields.")
    elif c >= 0.6 and o < 0.4:
        analysis.append("OPERATIONAL SPECIALIST PROFILE: You excel at deep execution, process optimization, and maintaining structural integrity. You thrive in environments with clear protocols, QA standards, and measurable outcomes. You are an asset in DevOps, cybersecurity, or structured database management.")
    elif c < 0.4 and o >= 0.6:
        analysis.append("INNOVATION CATALYST PROFILE: You naturally resist rigid structures but are highly adept at abstract problem-solving, rapid prototyping, and creative brainstorming. You excel in fast-paced R&D labs, early-stage startups, or user experience (UX) design environments where rules change rapidly.")
    else:
        analysis.append("ADAPTABLE EXECUTION STYLE: You approach tasks with balanced flexibility. You don't get trapped by perfectionism, allowing you to easily pivot between different types of daily workflows depending on team requirements.")

    # 2. Team Interaction & Collaboration Matrix (Extraversion + Agreeableness)
    if e >= 0.6 and a >= 0.6:
        analysis.append("COLLABORATIVE LEADERSHIP: You leverage emotional intelligence and social energy to align teams. You excel at cross-department communication, client-facing engineering roles, or serving as a Scrum Master where human connection is vital to project velocity.")
    elif e < 0.4 and a < 0.4:
        analysis.append("INDEPENDENT ANALYST: You prefer data-driven, asynchronous communication. You protect your cognitive focus and work best when evaluated on individual output rather than group discussions. You will thrive in dedicated backend engineering, algorithmic engineering, or data science pods.")
    elif e >= 0.6 and a < 0.4:
        analysis.append("COMPETITIVE DRIVER: You are highly competitive and outspoken. You challenge ideas openly and don't hold back critical technical feedback just to avoid conflict. You are excellent at auditing code, identifying project risks early, or pushing teams to hit tight deployment deadlines.")
    else:
        analysis.append("SUPPORTIVE INDEPENDENT: You are easy to work with but prefer working quietly behind the scenes. You bring stability to teams by consistently delivering on your technical promises without demanding social spotlight.")

    return "\n\n".join(analysis)


def generate_personal_development(o, c, e, a, n):
    """
    Advanced Behavioral Diagnostics: Generates specific self-management 
    and productivity blueprints to prevent burnout and maximize focus.
    """
    development = []

    # 1. Stress Management & Cognitive Friction (Neuroticism)
    if n >= 0.6:
        development.append("CRITICAL RISK - COGNITIVE FATIGUE: You register high sensitivity to shifting requirements and technical stress. To prevent burnout, avoid continuous contexts like live production firefighting or chaotic project management. Implement a 'Zero Notifications' deep-work block for 2 hours daily, and rely heavily on comprehensive documentation to lower situational anxiety.")
    else:
        development.append("STRESS RESILIENCE: You maintain high emotional stability under production pressure. You are structurally suited to handle high-severity live-site outages, crunch periods, and critical system failures without experiencing operational paralysis.")

    # 2. Execution Gaps & Weakness Mitigation (Conscientiousness)
    if c < 0.4:
        development.append("EXECUTION DIAGNOSTIC - ATTENTION DRIFT: Your natural workflow leans towards procrastination or getting distracted by new, shiny tech stacks before finishing current deliverables. Action Plan: Use time-boxing (Pomodoro technique) and break down your massive Jira/trello tickets into atomic micro-tasks. Do not allow yourself to open a new branch until the current PR is reviewed.")
    elif c >= 0.7:
        development.append("EXECUTION DIAGNOSTIC - PERFECTIONISM PARALYSIS: Your high conscientiousness makes you incredibly reliable, but you risk missing deadlines because you over-engineer solutions or rewrite code unnecessarily. Action Plan: Adopt the 'Minimum Viable Product (MVP)' mindset. Focus on getting a working prototype deployed first, then refactor incrementally.")

    # 3. Communication Blindspots (Agreeableness)
    if a < 0.4:
        development.append("COMMUNICATION BLINDSPOT - EXCESSIVE BLUNTNESS: While your logical critique is highly valuable, your direct feedback style can accidentally demotivate peers or stall team negotiations. Action Plan: When reviewing code or designs, explicitly state at least one technical element done right before breaking down structural architectural errors.")

    return "\n\n".join(development)