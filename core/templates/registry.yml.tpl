# Playbook and subagent bindings
# skill_path placeholder {{HOST_SKILLS}} rewritten by installer (FR-051b)

playbooks:
  - id: playbook-elastic
    tool: elastic
    skill_path: "{{HOST_SKILLS}}/playbook-elastic/SKILL.md"
    subagents:
      - inv-log-rca
    sources: []

  - id: playbook-k8s-logs
    tool: k8s-logs
    skill_path: "{{HOST_SKILLS}}/playbook-k8s-logs/SKILL.md"
    subagents:
      - inv-log-rca
    sources: []

  - id: playbook-mssql
    tool: mssql
    skill_path: "{{HOST_SKILLS}}/playbook-mssql/SKILL.md"
    subagents:
      - inv-data-rca
    sources: []

  - id: playbook-redis
    tool: redis
    skill_path: "{{HOST_SKILLS}}/playbook-redis/SKILL.md"
    subagents:
      - inv-data-rca
    sources: []
