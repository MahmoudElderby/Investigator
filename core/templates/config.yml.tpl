# Investigator configuration
# Populated by installer scaffold; investigator-init merges other fields.
# host and host_model_map.host are set by installer only (FR-051a).

host: cursor

knowledge_source: codebase_scan

model_tiers:
  orchestrator: deep
  inv-code-rca: deep
  inv-vendor-compare: deep
  inv-data-rca: mid
  inv-log-rca: fast
  inv-report: mid

host_model_map:
  host: cursor
  deep: inherit
  mid: inherit
  fast: inherit

data_sources: []
