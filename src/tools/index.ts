// [AI-GENERATED | plan: arpsis-mcp | model: cursor-agent]

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ArpsisClient } from "../client.js";
import { wrapCommentHtml } from "../client.js";
import type { ArpsisConfig } from "../config.js";

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true as const,
  };
}

export function registerArpsisTools(
  server: McpServer,
  client: ArpsisClient,
  config: ArpsisConfig,
): void {
  // --- Read: project ---
  server.registerTool(
    "arpsis_get_project",
    {
      description: "Get ARPSIS project by ID",
      inputSchema: { projectId: z.string().uuid().describe("Project UUID") },
    },
    async ({ projectId }) => {
      try {
        const data = await client.get(`/Projects/${projectId}`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_project_summary",
    {
      description: "Get ARPSIS project summary",
      inputSchema: { projectId: z.string().uuid() },
    },
    async ({ projectId }) => {
      try {
        const data = await client.get(`/Projects/${projectId}/summary`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_list_my_projects",
    {
      description: "List projects for the current user",
      inputSchema: {
        departmentId: z
          .string()
          .uuid()
          .optional()
          .describe("Department UUID (uses default if omitted)"),
      },
    },
    async ({ departmentId }) => {
      try {
        const dept = departmentId ?? config.defaultDepartmentId ?? "";
        const data = await client.get("/Projects/user/list", { departmentId: dept });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_list_projects_by_responsable",
    {
      description: "List projects filtered by responsable (owner) user ID",
      inputSchema: {
        responsableId: z.string().uuid(),
        departmentId: z.string().uuid().optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).optional(),
      },
    },
    async ({ responsableId, departmentId, page, pageSize }) => {
      try {
        const data = await client.get("/Projects", {
          query: "",
          responsableId,
          departmentId: departmentId ?? config.defaultDepartmentId ?? "",
          projectGroupId: "",
          systemId: "",
          scrumMasterId: "",
          page: page ?? 1,
          pageSize: pageSize ?? 10,
          sort: "desc",
          sortBy: "CreatedAt",
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_desk",
    {
      description: "Get ARPSIS desk/dashboard view for current user",
    },
    async () => {
      try {
        const data = await client.get("/Projects/Desk");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: functionals ---
  server.registerTool(
    "arpsis_list_functionals",
    {
      description: "List functionals for a project",
      inputSchema: {
        projectId: z.string().uuid(),
        page: z.number().int().optional(),
        pageSize: z.number().int().optional(),
      },
    },
    async ({ projectId, page, pageSize }) => {
      try {
        const data = await client.get("/Functionals", {
          query: "",
          projectId,
          responsableId: "",
          page: page ?? 1,
          pageSize: pageSize ?? 10,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_functional",
    {
      description: "Get a functional by ID (includes activity groups and requirements)",
      inputSchema: { functionalId: z.string().uuid() },
    },
    async ({ functionalId }) => {
      try {
        const data = await client.get(`/Functionals/${functionalId}`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: sprints & schedule ---
  server.registerTool(
    "arpsis_list_sprints",
    {
      description: "List sprints for a project",
      inputSchema: {
        projectId: z.string().uuid(),
        page: z.number().int().optional(),
        pageSize: z.number().int().optional(),
      },
    },
    async ({ projectId, page, pageSize }) => {
      try {
        const data = await client.get("/Sprints", {
          query: "",
          projectId,
          page: page ?? 1,
          pageSize: pageSize ?? 10,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_sprint",
    {
      description: "Get sprint detail by ID",
      inputSchema: { sprintId: z.string().uuid() },
    },
    async ({ sprintId }) => {
      try {
        const data = await client.get(`/Sprints/${sprintId}`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_schedule",
    {
      description: "Get project schedule/cronogram (scheluder endpoint)",
      inputSchema: {
        projectId: z.string().uuid(),
        sprintId: z.string().optional(),
        sprintStatus: z.string().optional(),
      },
    },
    async ({ projectId, sprintId, sprintStatus }) => {
      try {
        const data = await client.get(`/Projects/${projectId}/scheluder`, {
          query: "",
          sprintId: sprintId ?? "",
          sprintStatus: sprintStatus ?? "",
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: activities ---
  server.registerTool(
    "arpsis_list_my_assignments",
    {
      description: "List activities assigned to the current user (/tasks view)",
      inputSchema: {
        projectId: z.string().optional(),
        sprintId: z.string().optional(),
        page: z.number().int().optional(),
        pageSize: z.number().int().optional(),
        activityStatuss: z
          .array(z.number().int())
          .optional()
          .describe("Filter by status ids, e.g. [2,3] for InCourse"),
      },
    },
    async ({ projectId, sprintId, page, pageSize, activityStatuss }) => {
      try {
        const res = await fetchActivitiesUser(client, config, {
          projectId: projectId ?? "",
          sprintId: sprintId ?? "",
          page: page ?? 1,
          pageSize: pageSize ?? 10,
          activityStatuss: activityStatuss ?? [2, 3],
        });
        return jsonResult(res);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_list_project_activities",
    {
      description: "List all activities for a project",
      inputSchema: { projectId: z.string().uuid() },
    },
    async ({ projectId }) => {
      try {
        const data = await client.get(`/Activities/project/${projectId}/list`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_activity",
    {
      description: "Get activity by ID",
      inputSchema: { activityId: z.string().uuid() },
    },
    async ({ activityId }) => {
      try {
        const data = await client.get(`/Activities/${activityId}`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: follow-up & notifications ---
  server.registerTool(
    "arpsis_list_followup",
    {
      description: "List project traces (seguimiento) for a project",
      inputSchema: {
        projectId: z.string().uuid(),
        page: z.number().int().optional(),
        pageSize: z.number().int().optional(),
      },
    },
    async ({ projectId, page, pageSize }) => {
      try {
        const data = await client.get("/ProjectTraces", {
          query: "",
          projectId,
          page: page ?? 1,
          pageSize: pageSize ?? 10,
          actions: "Action",
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_list_notifications",
    {
      description: "List project trace notifications",
      inputSchema: {
        page: z.number().int().optional(),
        pageSize: z.number().int().optional(),
        unreadOnly: z.boolean().optional(),
      },
    },
    async ({ page, pageSize, unreadOnly }) => {
      try {
        const data = await client.get("/ProjectTraces/Notifications", {
          page: page ?? 1,
          pageSize: pageSize ?? 10,
          sort: "desc",
          sortBy: "Date",
          unreadOnly: unreadOnly ?? false,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_notifications_unread_count",
    {
      description: "Get unread notifications count",
    },
    async () => {
      try {
        const data = await client.get("/ProjectTraces/Notifications/UnreadCount");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_list_users",
    {
      description: "List all users (for resolving @mentions)",
    },
    async () => {
      try {
        const data = await client.get("/users/all");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_list_project_users",
    {
      description: "List users on a project team",
      inputSchema: { projectId: z.string().uuid() },
    },
    async ({ projectId }) => {
      try {
        const data = await client.get(`/Users/project/${projectId}/list`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_current_user",
    {
      description: "Get current user profile from OIDC userinfo",
    },
    async () => {
      try {
        const data = await client.getUserInfo();
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: requirements ---
  server.registerTool(
    "arpsis_list_requirements",
    {
      description: "List requirements (backlog items) for a project",
      inputSchema: {
        projectId: z.string().uuid().optional().describe("Project UUID (uses default if omitted)"),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).optional(),
      },
    },
    async ({ projectId, page, pageSize }) => {
      try {
        const data = await client.get("/Requirements", {
          projectId: projectId ?? config.defaultProjectId ?? "",
          page: page ?? 1,
          pageSize: pageSize ?? 10,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: dailies ---
  server.registerTool(
    "arpsis_list_dailies",
    {
      description: "List daily stand-up entries for the current user",
    },
    async () => {
      try {
        const data = await client.get("/Dailies");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: sticky notes ---
  server.registerTool(
    "arpsis_list_sticky_notes",
    {
      description: "List sticky notes for the current user",
    },
    async () => {
      try {
        const data = await client.get("/StickyNotes");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: systems ---
  server.registerTool(
    "arpsis_list_systems",
    {
      description: "List all systems (catalog of platforms/systems tracked in ARPSIS)",
    },
    async () => {
      try {
        const data = await client.get("/systems/all");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: calendar non-working days ---
  server.registerTool(
    "arpsis_get_nonworking_days",
    {
      description:
        "Get non-working days (holidays, weekends) in a date range. Dates in YYYY-MM-DD.",
      inputSchema: {
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
      },
    },
    async ({ from, to }) => {
      try {
        const data = await client.get(`/Calendars/days/norworking/range/${from}/${to}`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: calendar months ---
  server.registerTool(
    "arpsis_get_calendar_months",
    {
      description:
        "Get calendar month breakdown (working days per month) in a date range. Dates in YYYY-MM-DD.",
      inputSchema: {
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
      },
    },
    async ({ from, to }) => {
      try {
        const data = await client.get(`/Calendars/months/${from}/${to}`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: sprint summary ---
  server.registerTool(
    "arpsis_get_sprint_summary",
    {
      description: "Get sprint summary (progress, hours, activity counts)",
      inputSchema: { sprintId: z.string().uuid() },
    },
    async ({ sprintId }) => {
      try {
        const data = await client.get(`/Sprints/${sprintId}/summary`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: sprint completion status ---
  server.registerTool(
    "arpsis_get_sprint_complete",
    {
      description: "Get sprint completion status (finished vs planned)",
      inputSchema: { sprintId: z.string().uuid() },
    },
    async ({ sprintId }) => {
      try {
        const data = await client.get(`/Sprints/${sprintId}/complete`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: sprint activity by id ---
  server.registerTool(
    "arpsis_get_sprint_activity",
    {
      description:
        "Get a sprint-assigned activity by activity ID (the sprint-linked view, includes sprint metadata)",
      inputSchema: { activityId: z.string().uuid() },
    },
    async ({ activityId }) => {
      try {
        const data = await client.get(`/Sprints/activity/${activityId}`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: sprint impediments ---
  server.registerTool(
    "arpsis_list_sprint_impediments",
    {
      description: "List active sprint impediments (blockers) for the current user's sprints",
    },
    async () => {
      try {
        const data = await client.get("/SprintImpediments");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: elapsed activities (time tracking) ---
  server.registerTool(
    "arpsis_list_elapsed_activities",
    {
      description:
        "List time-tracked activities per developer (elapsed hours). Optional filters via query params.",
      inputSchema: {
        developerId: z.string().uuid().optional(),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").optional(),
      },
    },
    async ({ developerId, from, to }) => {
      try {
        const data = await client.get("/ActivitiesElapsed/Activities/Developer", {
          developerId,
          from,
          to,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_elapsed_summary",
    {
      description:
        "Get aggregated time-tracking summary (planned vs worked hours). Optional filters via query params.",
      inputSchema: {
        projectId: z.string().uuid().optional(),
        developerId: z.string().uuid().optional(),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").optional(),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD").optional(),
      },
    },
    async ({ projectId, developerId, from, to }) => {
      try {
        const data = await client.get("/ActivitiesElapsed/Summary", {
          projectId,
          developerId,
          from,
          to,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  server.registerTool(
    "arpsis_get_elapsed_summary_params",
    {
      description:
        "Get the parameter catalog for the time-tracking summary (valid developerIds, projectIds, date ranges)",
    },
    async () => {
      try {
        const data = await client.get("/ActivitiesElapsed/SummaryParameters");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: all activities (paginated global list) ---
  server.registerTool(
    "arpsis_list_all_activities",
    {
      description:
        "List activities globally (paginated). For a specific project use arpsis_list_project_activities.",
      inputSchema: {
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).optional(),
        projectId: z.string().uuid().optional(),
      },
    },
    async ({ page, pageSize, projectId }) => {
      try {
        const data = await client.get("/Activities", {
          projectId,
          page: page ?? 1,
          pageSize: pageSize ?? 10,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: activity groups for a project ---
  server.registerTool(
    "arpsis_list_activity_groups",
    {
      description: "List activity groups (features / epics) for a project",
      inputSchema: {
        projectId: z.string().uuid().optional().describe("Project UUID (uses default if omitted)"),
      },
    },
    async ({ projectId }) => {
      const pid = projectId ?? config.defaultProjectId;
      if (!pid) return errorResult("projectId required (no default set)");
      try {
        const data = await client.get(`/ActivityGroups/${pid}/list`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: activity groups filtered by functional ---
  server.registerTool(
    "arpsis_list_activity_groups_by_functional",
    {
      description: "List activity groups for a project filtered by functional (module)",
      inputSchema: {
        projectId: z.string().uuid().optional().describe("Project UUID (uses default if omitted)"),
        functionalId: z.string().uuid(),
      },
    },
    async ({ projectId, functionalId }) => {
      const pid = projectId ?? config.defaultProjectId;
      if (!pid) return errorResult("projectId required (no default set)");
      try {
        const data = await client.get(
          `/ActivityGroups/${pid}/list/functional/${functionalId}`,
        );
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: search projects by text/filters ---
  server.registerTool(
    "arpsis_search_projects",
    {
      description:
        "Search projects with text query and optional filters (department, system, scrum master, project group). For owner-only see arpsis_list_projects_by_responsable.",
      inputSchema: {
        query: z.string().optional().describe("Free-text search (name/code)"),
        departmentId: z.string().uuid().optional(),
        projectGroupId: z.string().uuid().optional(),
        systemId: z.string().uuid().optional(),
        scrumMasterId: z.string().uuid().optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).optional(),
        sortBy: z.string().optional(),
        sort: z.enum(["asc", "desc"]).optional(),
      },
    },
    async ({ query, departmentId, projectGroupId, systemId, scrumMasterId, page, pageSize, sortBy, sort }) => {
      try {
        const data = await client.get("/Projects", {
          query: query ?? "",
          responsableId: "",
          departmentId: departmentId ?? config.defaultDepartmentId ?? "",
          projectGroupId: projectGroupId ?? "",
          systemId: systemId ?? "",
          scrumMasterId: scrumMasterId ?? "",
          page: page ?? 1,
          pageSize: pageSize ?? 10,
          sort: sort ?? "desc",
          sortBy: sortBy ?? "CreatedAt",
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: project attachments ---
  server.registerTool(
    "arpsis_list_project_attachments",
    {
      description: "List attachments (files) for a project",
      inputSchema: {
        projectId: z.string().uuid().optional().describe("Project UUID (uses default if omitted)"),
      },
    },
    async ({ projectId }) => {
      const pid = projectId ?? config.defaultProjectId;
      if (!pid) return errorResult("projectId required (no default set)");
      try {
        const data = await client.get(`/Projects/${pid}/Attachments`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: projects by priority ---
  server.registerTool(
    "arpsis_list_projects_by_priority",
    {
      description: "List projects grouped/sorted by priority (dashboard view)",
    },
    async () => {
      try {
        const data = await client.get("/Projects/ProjectsByPriority");
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: test runs ---
  server.registerTool(
    "arpsis_list_test_runs",
    {
      description: "List QA test runs (executions)",
      inputSchema: {
        projectId: z.string().uuid().optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).optional(),
      },
    },
    async ({ projectId, page, pageSize }) => {
      try {
        const data = await client.get("/TestRuns", {
          projectId,
          page: page ?? 1,
          pageSize: pageSize ?? 10,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: test cases owned by a user ---
  server.registerTool(
    "arpsis_list_owned_test_cases",
    {
      description:
        "List test cases owned by a user (QA queue). If ownerId is omitted, defaults to the current user (sub from the auth token). Server returns 500 if ownerId ends up empty.",
      inputSchema: {
        ownerId: z
          .string()
          .uuid()
          .optional()
          .describe("Owner user UUID — defaults to the current user"),
        projectId: z.string().uuid().optional(),
        query: z.string().optional(),
        issueStatuss: z
          .array(z.number().int())
          .optional()
          .describe("Filter by issue status codes; defaults to [4] (open)"),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).optional(),
      },
    },
    async ({ ownerId, projectId, query, issueStatuss, page, pageSize }) => {
      try {
        const resolvedOwnerId = ownerId ?? (await resolveCurrentUserId(client));
        if (!resolvedOwnerId) {
          return errorResult(
            "Could not resolve ownerId: pass ownerId explicitly or ensure the token has a sub claim.",
          );
        }
        const url = new URL(`${config.apiBase}/TestRuns/TestCases/Owner`);
        url.searchParams.set("query", query ?? "");
        url.searchParams.set("projectId", projectId ?? "");
        url.searchParams.set("ownerId", resolvedOwnerId);
        url.searchParams.set("page", String(page ?? 1));
        url.searchParams.set("pageSize", String(pageSize ?? 10));
        for (const s of issueStatuss ?? [4]) {
          url.searchParams.append("issueStatuss", String(s));
        }
        const data = await client.get(url.pathname + url.search);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: project trace groups ---
  server.registerTool(
    "arpsis_list_trace_groups",
    {
      description:
        "List project-trace groups (follow-up conversation threads) for a project",
      inputSchema: {
        projectId: z.string().uuid().optional().describe("Project UUID (uses default if omitted)"),
      },
    },
    async ({ projectId }) => {
      const pid = projectId ?? config.defaultProjectId;
      if (!pid) return errorResult("projectId required (no default set)");
      try {
        const data = await client.get(`/ProjectTraceGroups/${pid}/list`);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Write: create activity ---
  server.registerTool(
    "arpsis_create_activity",
    {
      description: "Create a new activity under a functional group/requirement",
      inputSchema: {
        projectId: z.string().uuid(),
        functionalId: z.string().uuid(),
        groupId: z.string().uuid(),
        requirementId: z.string().uuid(),
        name: z.string().min(1),
        developerId: z.string().uuid(),
        developerName: z.string().optional(),
        order: z.number().int().optional(),
        plannedHours: z.number().optional(),
        activityStatus: z.number().int().optional(),
        itemStatusCode: z.number().int().optional(),
        score: z.number().optional(),
      },
    },
    async (input) => {
      try {
        const body = {
          projectId: input.projectId,
          functionalId: input.functionalId,
          groupId: input.groupId,
          requirementId: input.requirementId,
          order: input.order ?? 1,
          name: input.name,
          description: "",
          activityStatus: input.activityStatus ?? 1,
          activityStatusId: input.activityStatus ?? 1,
          itemStatusCode: input.itemStatusCode ?? 1,
          score: input.score ?? 1,
          plannedHours: input.plannedHours ?? 1,
          workedHours: 0,
          references: "",
          developerId: input.developerId,
          developerName: input.developerName ?? "",
          isEditing: true,
          over: true,
        };
        const data = await client.post("/Activities", body);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Write: follow-up comment ---
  server.registerTool(
    "arpsis_add_followup_comment",
    {
      description: "Add a seguimiento note with optional @mentions",
      inputSchema: {
        projectId: z.string().uuid(),
        groupId: z.string().uuid(),
        text: z.string().min(1),
        mentions: z
          .array(
            z.object({
              userId: z.string().uuid(),
              email: z.string().email(),
              label: z.string(),
            }),
          )
          .optional(),
      },
    },
    async ({ projectId, groupId, text, mentions }) => {
      try {
        const content = wrapCommentHtml(text, mentions);
        const data = await client.post("/ProjectTraces", {
          projectId,
          groupId,
          note: { content, attachments: [] },
          action: "Note",
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Write: update activity (funcional view) ---
  server.registerTool(
    "arpsis_update_activity",
    {
      description: "Update an activity (status, dates, developer, note) via PUT /Activities/{id}",
      inputSchema: {
        activityId: z.string().uuid(),
        body: z.record(z.unknown()).describe("Full or partial activity JSON from GET activity"),
      },
    },
    async ({ activityId, body }) => {
      try {
        const data = await client.put(`/Activities/${activityId}`, body);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Write: change status in sprint ---
  server.registerTool(
    "arpsis_change_sprint_activity_status",
    {
      description: "Update activity status within a sprint context (PUT /Sprints/activity)",
      inputSchema: {
        body: z.record(z.unknown()).describe("Sprint activity payload from HAR (sprintId, activityStatus, etc.)"),
      },
    },
    async ({ body }) => {
      try {
        const data = await client.put("/Sprints/activity", body);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Write: update sprint (full replace) ---
  server.registerTool(
    "arpsis_update_sprint",
    {
      description:
        "Full sprint update (PUT /Sprints/:id). Fetch the sprint via arpsis_get_sprint first, mutate the returned object, then pass it here — the payload replaces the whole sprint including nested groups/requirements. Missing fields will be treated as removed.",
      inputSchema: {
        sprintId: z.string().uuid(),
        body: z
          .record(z.unknown())
          .describe(
            "Full sprint object (must include id, name, sprintStatus, startDate, endDate, groups[]). Get shape from arpsis_get_sprint first.",
          ),
      },
    },
    async ({ sprintId, body }) => {
      try {
        const data = await client.put(`/Sprints/${sprintId}`, body);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Write: mark notifications read ---
  server.registerTool(
    "arpsis_mark_notifications_read",
    {
      description: "Mark notifications as read",
      inputSchema: {
        projectTraceIds: z.array(z.string().uuid()).min(1),
      },
    },
    async ({ projectTraceIds }) => {
      try {
        const data = await client.put("/ProjectTraces/SetManyRead", { projectTraceIds });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );

  // --- Read: catalog lookups ---
  server.registerTool(
    "arpsis_get_lookups",
    {
      description:
        "Get an ARPSIS catalog/lookup list (statuses, departments, labels, functionals). Use this before creating/updating activities or sprints to resolve IDs.",
      inputSchema: {
        catalog: z
          .enum([
            "activityStatuss",
            "sprintStatuss",
            "projectStatuss",
            "departments",
            "labels",
            "functionals",
          ])
          .describe("Which catalog to fetch"),
      },
    },
    async ({ catalog }) => {
      const path = LOOKUP_PATHS[catalog];
      try {
        const data = await client.get(path);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e instanceof Error ? e.message : "Unknown error");
      }
    },
  );
}

const LOOKUP_PATHS: Record<string, string> = {
  activityStatuss: "/activityStatuss/list",
  sprintStatuss: "/sprintStatuss/list",
  projectStatuss: "/ProjectStatuss/list",
  departments: "/Departments",
  labels: "/Labels",
  functionals: "/Functionals",
};

async function resolveCurrentUserId(client: ArpsisClient): Promise<string | null> {
  try {
    const info = await client.getUserInfo();
    const sub = (info as { sub?: unknown }).sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

async function fetchActivitiesUser(
  client: ArpsisClient,
  config: ArpsisConfig,
  opts: {
    projectId: string;
    sprintId: string;
    page: number;
    pageSize: number;
    activityStatuss: number[];
  },
): Promise<unknown> {
  const url = new URL(`${config.apiBase}/Activities/User`);
  if (opts.projectId) url.searchParams.set("projectId", opts.projectId);
  if (opts.sprintId) url.searchParams.set("sprintId", opts.sprintId);
  url.searchParams.set("developerId", "");
  url.searchParams.set("page", String(opts.page));
  url.searchParams.set("pageSize", String(opts.pageSize));
  for (const s of opts.activityStatuss) {
    url.searchParams.append("activityStatuss", String(s));
  }

  const pathWithQuery = url.pathname + url.search;
  return client.get(pathWithQuery);
}
