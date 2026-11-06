"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { requestSamplePrep } from "@/server/omics";

export async function devSignIn(formData: FormData) {
  await signIn("credentials", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    redirectTo: "/home",
  });
}

export async function entraSignIn() {
  await signIn("microsoft-entra-id", { redirectTo: "/home" });
}

export async function leave() {
  await signOut({ redirectTo: "/login" });
}

export async function setCustomer(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const id = Number(formData.get("customerId"));
  const jar = await cookies();
  if (!Number.isInteger(id) || id <= 0) {
    jar.delete("goliath_customer_id");
  } else {
    jar.set("goliath_customer_id", String(id), { httpOnly: true, sameSite: "lax", path: "/" });
  }
  redirect(String(formData.get("returnTo") || "/home"));
}

export async function queueSamplePrep(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  let requestId = "";
  try {
    const queued = await requestSamplePrep({
      studyRowId: Number(formData.get("studyRowId")),
      projectPath: String(formData.get("projectPath") ?? ""),
      workflowVersionId: Number(formData.get("workflowVersionId") || 0),
      samplesJson: String(formData.get("samplesJson") ?? ""),
      sampleId: String(formData.get("sampleId") ?? ""),
      sampleDir: String(formData.get("sampleDir") ?? ""),
      fastqPrefix: String(formData.get("fastqPrefix") ?? ""),
      fastqStorageJson: String(formData.get("fastqStorageJson") ?? ""),
      sampleStorageJson: String(formData.get("sampleStorageJson") ?? ""),
      pipelineProfile: String(formData.get("pipelineProfile") ?? ""),
      pipelineProcedure: String(formData.get("pipelineProcedure") ?? ""),
      createdBy: session.user.email,
    });
    requestId = String(queued.queued[0]?.request_id ?? queued.queued[0]?.requestId ?? "");
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo encolar SamplePrep.";
    redirect(`/sample-prep?error=${encodeURIComponent(message)}`);
  }
  redirect(`/sample-prep?queued=${encodeURIComponent(requestId)}`);
}
