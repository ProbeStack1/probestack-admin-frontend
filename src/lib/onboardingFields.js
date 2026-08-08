export const organizationSections = [
  {
    title: "General",
    fields: [
      { key: "organization_id", label: "Organization ID", readOnly: true },
      { key: "organization_code", label: "Organization Code" },
      { key: "name", label: "Organization Name", required: true },
      { key: "legal_name", label: "Legal Name" },
      { key: "description", label: "Description", type: "textarea", required: true, className: "md:col-span-2" },
      { key: "industry", label: "Industry" },
      { key: "business_type", label: "Business Type", options: ["Enterprise", "SMB"] },
    ],
  },
  {
    title: "Location",
    fields: [
      { key: "country", label: "Country" },
      { key: "region", label: "Region" },
      { key: "time_zone", label: "Time Zone" },
      { key: "headquarters", label: "Headquarters" },
      { key: "default_currency", label: "Default Currency" },
    ],
  },
  {
    title: "Billing",
    fields: [
      { key: "billing_account", label: "Billing Account" },
      { key: "cost_center", label: "Cost Center" },
      { key: "tax_id", label: "Tax ID" },
    ],
  },
  {
    title: "Public presence",
    fields: [
      { key: "website", label: "Website" },
      { key: "logo_url", label: "Logo" },
    ],
  },
  {
    title: "Contacts",
    fields: [
      { key: "primary_contact_id", label: "Primary Contact" },
      { key: "executive_sponsor_id", label: "Executive Sponsor" },
      { key: "technical_contact_id", label: "Technical Contact" },
      { key: "security_contact_id", label: "Security Contact" },
    ],
  },
  {
    title: "Identity & access",
    fields: [
      { key: "identity_provider", label: "Identity Provider", options: ["zitadel", "auth0"] },
      { key: "sso_enabled", label: "SSO Enabled", type: "switch" },
      { key: "scim_enabled", label: "SCIM Enabled", type: "switch" },
      { key: "mfa_required", label: "MFA Required", type: "switch" },
    ],
  },
  {
    title: "Platform defaults",
    fields: [
      { key: "default_api_gateway", label: "Default API Gateway" },
      { key: "default_ai_gateway", label: "Default AI Gateway" },
      { key: "default_mcp_gateway", label: "Default MCP Gateway" },
      { key: "default_api_design_tool", label: "Default API Design" },
      { key: "default_api_testing_tool", label: "Default API Testing" },
      { key: "api_agent_lifecycle_stage", label: "API or Agent LifeCycle" },
      { key: "default_api_inventory", label: "Default API Inventory" },
      { key: "cloud_provider", label: "Cloud Provider" },
      { key: "kubernetes_platform", label: "Kubernetes Platform" },
      { key: "default_environment_strategy", label: "Default Environment Strategy" },
    ],
  },
  {
    title: "Governance",
    fields: [
      { key: "compliance_standards", label: "Compliance Standards", type: "list" },
      { key: "encryption_standard", label: "Encryption Standard" },
      { key: "data_residency", label: "Data Residency" },
      { key: "status", label: "Status", readOnly: true },
      { key: "created_by", label: "Created By", readOnly: true },
      { key: "created_at", label: "Created Date", readOnly: true },
    ],
  },
];

export const businessUnitSections = [
  {
    title: "General",
    fields: [
      { key: "business_unit_id", label: "Business Unit ID", readOnly: true },
      { key: "organization_id", label: "Organization", readOnly: true },
      { key: "code", label: "Business Unit Code" },
      { key: "name", label: "Business Unit Name", required: true },
      { key: "display_name", label: "Display Name" },
      { key: "description", label: "Description", type: "textarea", className: "md:col-span-2" },
      { key: "parent_business_unit_id", label: "Parent Business Unit" },
      { key: "division", label: "Division" },
      { key: "department", label: "Department" },
      { key: "line_of_business", label: "Line of Business" },
    ],
  },
  {
    title: "Ownership",
    fields: [
      { key: "business_executive_id", label: "Business Executive" },
      { key: "business_owner_id", label: "Business Owner" },
      { key: "product_owner_id", label: "Product Owner" },
      { key: "technical_owner_id", label: "Technical Owner" },
      { key: "enterprise_architect_id", label: "Enterprise Architect" },
      { key: "platform_owner_id", label: "Platform Owner" },
      { key: "security_owner_id", label: "Security Owner" },
      { key: "compliance_officer_id", label: "Compliance Officer" },
      { key: "support_team", label: "Support Team" },
      { key: "operations_team", label: "Operations Team" },
    ],
  },
  {
    title: "Financial",
    fields: [
      { key: "cost_center", label: "Cost Center" },
      { key: "budget", label: "Budget", type: "number" },
      { key: "chargeback_model", label: "Chargeback Model" },
      { key: "billing_account", label: "Billing Account" },
      { key: "monthly_budget", label: "Monthly Budget", type: "number" },
      { key: "annual_budget", label: "Annual Budget", type: "number" },
      { key: "ai_budget", label: "AI Budget", type: "number" },
      { key: "api_budget", label: "API Budget", type: "number" },
    ],
  },
  {
    title: "Infrastructure",
    fields: [
      { key: "cloud_provider", label: "Cloud Provider" },
      { key: "region", label: "Region" },
      { key: "kubernetes_cluster", label: "Kubernetes Cluster" },
      { key: "namespace", label: "Namespace" },
      { key: "api_gateway", label: "API Gateway" },
      { key: "ai_gateway", label: "AI Gateway" },
      { key: "logging_platform", label: "Logging Platform" },
      { key: "monitoring_platform", label: "Monitoring Platform" },
      { key: "secret_manager", label: "Secret Manager" },
    ],
  },
  {
    title: "Governance",
    fields: [
      { key: "approval_workflow", label: "Approval Workflow" },
      { key: "risk_classification", label: "Risk Classification", options: ["Critical", "High", "Medium", "Low"] },
      { key: "business_criticality", label: "Business Criticality", options: ["Critical", "High", "Medium", "Low"] },
      { key: "data_classification", label: "Data Classification", options: ["Public", "Internal", "Confidential", "Restricted"] },
      { key: "regulatory_standards", label: "Regulatory Standards", type: "list" },
      { key: "retention_policy", label: "Retention Policy" },
      { key: "backup_policy", label: "Backup Policy" },
      { key: "dr_enabled", label: "DR Enabled", type: "switch" },
      { key: "sla_tier", label: "SLA Tier", options: ["Platinum", "Gold", "Silver", "Bronze"] },
    ],
  },
  {
    title: "Quotas",
    fields: [
      { key: "api_calls_quota", label: "API Calls", type: "number" },
      { key: "ai_tokens_quota", label: "AI Tokens", type: "number" },
      { key: "storage_quota", label: "Storage", type: "number" },
      { key: "compute_hours_quota", label: "Compute Hours", type: "number" },
      { key: "agent_runtime_quota", label: "Agent Runtime", type: "number" },
      { key: "mcp_connections_quota", label: "MCP Connections", type: "number" },
    ],
  },
];

export const projectSections = [
  {
    title: "General",
    fields: [
      { key: "project_id", label: "Project ID", readOnly: true },
      { key: "business_unit_id", label: "Business Unit", type: "businessUnitSelect", required: true },
      { key: "code", label: "Project Code" },
      { key: "name", label: "Project Name", required: true },
      { key: "description", label: "Description", type: "textarea", className: "md:col-span-2" },
      { key: "project_type", label: "Project Type" },
      { key: "portfolio", label: "Portfolio" },
      { key: "status", label: "Status", options: ["active", "inactive", "pending", "on_hold", "completed", "archived"] },
    ],
  },
  {
    title: "Ownership",
    fields: [
      { key: "project_manager_id", label: "Project Manager" },
      { key: "product_manager_id", label: "Product Manager" },
      { key: "scrum_master_id", label: "Scrum Master" },
      { key: "technical_lead_id", label: "Technical Lead" },
      { key: "security_lead_id", label: "Security Lead" },
      { key: "devops_lead_id", label: "DevOps Lead" },
    ],
  },
  {
    title: "Delivery",
    fields: [
      { key: "methodology", label: "Methodology", options: ["Scrum", "Kanban", "Waterfall", "SAFe", "Hybrid"] },
      { key: "sprint_duration", label: "Sprint Duration" },
      { key: "repository", label: "Repository" },
      { key: "cicd_tool", label: "CI/CD Tool" },
      { key: "issue_tracker", label: "Issue Tracker" },
      { key: "documentation_url", label: "Documentation" },
    ],
  },
  {
    title: "Security",
    fields: [
      { key: "authentication_method", label: "Authentication" },
      { key: "authorization_method", label: "Authorization" },
      { key: "oauth_provider", label: "OAuth Provider" },
      { key: "mtls_enabled", label: "mTLS", type: "switch" },
      { key: "jwt_enabled", label: "JWT", type: "switch" },
      { key: "api_key_enabled", label: "API Key", type: "switch" },
      { key: "secrets_vault", label: "Secrets Vault" },
    ],
  },
  {
    title: "Deployment",
    fields: ["dev", "qa", "uat", "performance", "stage", "production"].flatMap((env) => [
      { key: `${env}_enabled`, label: `${env.toUpperCase()} Enabled`, type: "switch" },
      { key: `${env}_endpoint_url`, label: `${env.toUpperCase()} Endpoint URL` },
    ]),
  },
  {
    title: "Compliance",
    fields: [
      { key: "pci_applicable", label: "PCI", type: "switch" },
      { key: "standard_rules", label: "Standard Rules", type: "textarea" },
      { key: "custom_rules", label: "Custom Rules", type: "textarea" },
      { key: "owasp_top10_enabled", label: "OWASP 10", type: "switch" },
      { key: "linting_enabled", label: "Linting", type: "switch" },
    ],
  },
];

export const applicationSections = [
  {
    title: "General",
    fields: [
      { key: "application_id", label: "Application ID", readOnly: true },
      { key: "project_id", label: "Project", type: "projectSelect", required: true },
      { key: "application_name", label: "Application Name", required: true },
      { key: "display_name", label: "Display Name" },
      { key: "description", label: "Description", type: "textarea", className: "md:col-span-2" },
      { key: "business_capability", label: "Business Capability" },
      { key: "domain", label: "Domain" },
      { key: "application_type", label: "Application Type" },
      { key: "criticality", label: "Criticality" },
    ],
  },
  {
    title: "Runtime",
    fields: [
      { key: "runtime", label: "Runtime" },
      { key: "language", label: "Language" },
      { key: "framework", label: "Framework" },
      { key: "version", label: "Version" },
      { key: "container_image", label: "Container" },
      { key: "kubernetes_namespace", label: "Kubernetes Namespace" },
      { key: "cluster", label: "Cluster" },
    ],
  },
  {
    title: "API",
    fields: [
      { key: "api_count", label: "API Count", type: "number" },
      { key: "api_gateway", label: "API Gateway" },
      { key: "base_url", label: "Base URL" },
      { key: "openapi_spec_url", label: "OpenAPI" },
      { key: "asyncapi_spec_url", label: "AsyncAPI" },
      { key: "graphql_enabled", label: "GraphQL", type: "switch" },
      { key: "webhooks_enabled", label: "Webhooks", type: "switch" },
    ],
  },
  {
    title: "AI",
    fields: [
      { key: "llm_provider", label: "LLM Provider" },
      { key: "default_model", label: "Default Model" },
      { key: "embedding_model", label: "Embedding Model" },
      { key: "ai_gateway", label: "AI Gateway" },
      { key: "vector_database", label: "Vector Database" },
      { key: "prompt_registry", label: "Prompt Registry" },
    ],
  },
  {
    title: "MCP",
    fields: [
      { key: "mcp_enabled", label: "MCP Enabled", type: "switch" },
      { key: "mcp_server", label: "MCP Server" },
      { key: "mcp_resources", label: "MCP Resources", type: "list" },
      { key: "mcp_tools", label: "MCP Tools", type: "list" },
      { key: "mcp_prompts", label: "MCP Prompts", type: "list" },
    ],
  },
  {
    title: "Agent",
    fields: [
      { key: "agent_enabled", label: "Agent Enabled", type: "switch" },
      { key: "planner", label: "Planner" },
      { key: "executor", label: "Executor" },
      { key: "memory", label: "Memory" },
      { key: "knowledge_base", label: "Knowledge Base" },
      { key: "multi_agent_enabled", label: "Multi-Agent Enabled", type: "switch" },
      { key: "workflow", label: "Workflow" },
    ],
  },
  {
    title: "Monitoring",
    fields: [
      { key: "logging", label: "Logging" },
      { key: "metrics", label: "Metrics" },
      { key: "tracing", label: "Tracing" },
      { key: "alerts", label: "Alerts" },
      { key: "dashboards", label: "Dashboards" },
    ],
  },
  {
    title: "Security",
    fields: [
      { key: "oauth_enabled", label: "OAuth", type: "switch" },
      { key: "jwt_enabled", label: "JWT", type: "switch" },
      { key: "api_key_enabled", label: "API Key", type: "switch" },
      { key: "mtls_enabled", label: "mTLS", type: "switch" },
      { key: "dlp_enabled", label: "DLP", type: "switch" },
      { key: "waf_enabled", label: "WAF", type: "switch" },
      { key: "encryption_standard", label: "Encryption Standard" },
    ],
  },
  {
    title: "Billing",
    fields: [
      { key: "cost_center", label: "Cost Center" },
      { key: "monthly_budget", label: "Monthly Budget", type: "number" },
      { key: "token_budget", label: "Token Budget", type: "number" },
      { key: "api_budget", label: "API Budget", type: "number" },
    ],
  },
];

export const flattenFields = (sections) => sections.flatMap((section) => section.fields);

export const buildInitialData = (sections, source = {}) => {
  return flattenFields(sections).reduce((data, field) => {
    const value = source[field.key];
    if (field.type === "switch") {
      data[field.key] = Boolean(value);
    } else if (field.type === "list") {
      data[field.key] = Array.isArray(value) ? value.join(", ") : value || "";
    } else {
      data[field.key] = value ?? "";
    }
    return data;
  }, {});
};

export const buildPayloadFromData = (sections, formData) => {
  return flattenFields(sections).reduce((payload, field) => {
    if (field.readOnly) return payload;
    const value = formData[field.key];
    if (field.type === "switch") {
      payload[field.key] = Boolean(value);
    } else if (field.type === "number") {
      payload[field.key] = value === "" || value === null || value === undefined ? null : Number(value);
    } else if (field.type === "list") {
      payload[field.key] = String(value || "")
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      payload[field.key] = typeof value === "string" ? value.trim() || null : value || null;
    }
    return payload;
  }, {});
};
