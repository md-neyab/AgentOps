export interface GitHubPRResult {
  pr_url: string;
  pr_number: number;
  branch: string;
  simulated: boolean;
}

function cleanOwnerAndRepo(): { owner: string; repo: string } {
  let rawOwner = (process.env.GITHUB_OWNER || "").trim();
  let rawRepo = (process.env.GITHUB_REPO || "").trim();

  // If GITHUB_REPO has full URL like https://github.com/md-neyab/AgentOps
  if (rawRepo.includes("github.com/")) {
    const parts = rawRepo.replace(/.*github\.com\//, "").split("/").filter(Boolean);
    if (parts.length >= 2) {
      rawOwner = parts[0];
      rawRepo = parts[1];
    } else if (parts.length === 1) {
      rawRepo = parts[0];
    }
  }

  // Clean trailing slashes or .git
  rawOwner = rawOwner.replace(/^https?:\/\/github\.com\//, "").replace(/\/.*$/, "").trim() || "md-neyab";
  rawRepo = rawRepo.replace(/\.git$/, "").replace(/^\/+|\/+$/g, "").trim() || "AgentOps";

  return { owner: rawOwner, repo: rawRepo };
}

export async function createGitHubPullRequest({
  branchName,
  filePath,
  prTitle,
  prBody,
  patchContent,
}: {
  branchName: string;
  filePath: string;
  prTitle: string;
  prBody: string;
  patchContent: string;
}): Promise<GitHubPRResult> {
  const token = (process.env.GITHUB_TOKEN || "").trim();
  const { owner, repo } = cleanOwnerAndRepo();

  if (!token || token.includes("placeholder")) {
    console.warn("GITHUB_TOKEN not configured. Using simulated PR link.");
    const mockNumber = Math.floor(100 + Math.random() * 900);
    return {
      pr_url: `https://github.com/${owner}/${repo}/pull/${mockNumber}`,
      pr_number: mockNumber,
      branch: branchName,
      simulated: true,
    };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AgentOps-AI-Copilot",
    "Content-Type": "application/json",
  };

  try {
    // 1. Get repository details to discover default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });

    if (!repoRes.ok) {
      const errText = await repoRes.text();
      throw new Error(`Failed to access repo ${owner}/${repo}: ${repoRes.status} ${errText}`);
    }

    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || "main";

    // 2. Get latest commit SHA on default branch
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`,
      { headers }
    );

    if (!refRes.ok) {
      const errText = await refRes.text();
      throw new Error(`Failed to get ref for heads/${defaultBranch}: ${refRes.status} ${errText}`);
    }

    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // 3. Create unique hotfix branch
    const timestampSuffix = Date.now().toString(36);
    const cleanBranch = (
      branchName.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() +
      "-" +
      timestampSuffix
    ).slice(0, 50);

    const createBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${cleanBranch}`,
        sha: baseSha,
      }),
    });

    if (!createBranchRes.ok) {
      const errText = await createBranchRes.text();
      throw new Error(`Failed to create branch ${cleanBranch}: ${createBranchRes.status} ${errText}`);
    }

    // 4. Check if file already exists in branch to provide SHA if updating
    let fileSha: string | undefined = undefined;
    try {
      const existingFileRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${cleanBranch}`,
        { headers }
      );
      if (existingFileRes.ok) {
        const existingData = await existingFileRes.json();
        fileSha = existingData.sha;
      }
    } catch {
      // New file, no SHA needed
    }

    // 5. Commit patch file
    const contentEncoded = Buffer.from(
      `// Auto-generated remediation patch by AgentOps AI\n// File: ${filePath}\n\n${patchContent}\n`
    ).toString("base64");

    const commitBody: Record<string, unknown> = {
      message: prTitle,
      content: contentEncoded,
      branch: cleanBranch,
    };
    if (fileSha) {
      commitBody.sha = fileSha;
    }

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(commitBody),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`Failed to commit file ${filePath}: ${putRes.status} ${errText}`);
    }

    // 6. Open Pull Request
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: prTitle,
        head: cleanBranch,
        base: defaultBranch,
        body: `${prBody}\n\n---\n*Remediated and verified autonomously via **AgentOps AI** (Human-in-the-Loop Approved).*`,
      }),
    });

    if (!prRes.ok) {
      const errText = await prRes.text();
      throw new Error(`Failed to create Pull Request: ${prRes.status} ${errText}`);
    }

    const prData = await prRes.json();
    return {
      pr_url: prData.html_url,
      pr_number: prData.number,
      branch: cleanBranch,
      simulated: false,
    };
  } catch (error) {
    console.error("GitHub API PR creation failed:", error);
    // If GitHub API fails, return simulated fallback
    const mockNumber = Math.floor(100 + Math.random() * 900);
    return {
      pr_url: `https://github.com/${owner}/${repo}/pull/${mockNumber}`,
      pr_number: mockNumber,
      branch: branchName,
      simulated: true,
    };
  }
}
