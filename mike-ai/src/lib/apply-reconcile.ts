import type { IncomingFile, IncomingProject } from "./reconcile";
import { planPreserveMerge } from "./reconcile";
import {
  insertFileIfAbsent,
  insertProjectIfAbsent,
  insertRevisionIfAbsent,
  listFiles,
  listProjectsNewestFirst,
} from "./platform-store";

export async function applyPreserveMerge(input: {
  incomingProjects?: IncomingProject[];
  incomingFiles?: IncomingFile[];
}) {
  const projects = await listProjectsNewestFirst();
  const files = await listFiles({});
  const plan = planPreserveMerge({
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      summary: project.summary,
      status: project.status,
      tags: project.tags,
    })),
    files: files.map((file) => ({
      id: file.id,
      project_id: file.project_id,
      name: file.name,
      checksum_sha256: file.checksum_sha256,
    })),
    incomingProjects: input.incomingProjects,
    incomingFiles: input.incomingFiles,
  });

  let insertedProjects = 0;
  for (const project of plan.insertProjects) {
    if (await insertProjectIfAbsent(project)) insertedProjects += 1;
  }
  let insertedFiles = 0;
  for (const file of plan.insertFiles) {
    if (
      await insertFileIfAbsent({
        id: file.id,
        projectId: file.projectId,
        name: file.name,
        mimeType: file.mimeType,
        bytes: file.bytes,
        checksum: file.checksum,
      })
    ) {
      insertedFiles += 1;
    }
  }
  let preservedRevisions = 0;
  for (const revision of plan.appendRevisions) {
    if (await insertRevisionIfAbsent(revision)) preservedRevisions += 1;
  }

  return {
    insertedProjects,
    insertedFiles,
    preservedRevisions,
    keptProjectIds: plan.keptProjectIds,
    skippedFileIds: plan.skippedFileIds,
    refusedFiles: plan.refusedFiles,
  };
}
