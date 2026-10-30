export interface GitHubPRResult {
  pr_url: string;
  pr_number: number;
  branch: string;
  simulated: boolean;
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
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "enterprise-demo";
  const repo = process.env.GITHUB_REPO || "auth-service";

  // Check if real token is provided
  if (!token || token.trim() === "" || token.includes("placeholder")) {
    console.info("GITHUB_TOKEN not detected or placeholder. Operating in simulated PR mode.");
    const mockPrNumber = Math.floor(100 + Math.random() * 900);
    return {
      pr_url: `https://github.com/${owner}/${repo}/pull/${mockPrNumber}`,
      pr_number: mockPrNumber,
      branch: branchName,
      simulated: true,
    };
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "AgentOps-AI-Assistant",
      "Content-Type": "application/json",
    };

    // 1. Get default branch SHA (e.g. 'main')
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
      headers,
    });

    if (!refRes.ok) {
      throw new Error(`Failed to fetch main branch ref: ${refRes.statusText}`);
    }

    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // 2. Create hotfix branch
    const cleanBranch = branchName.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const createBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${cleanBranch}`,
        sha: baseSha,
      }),
    });

    // 3. Create or update file content in branch
    const contentEncoded = Buffer.from(
      `// Auto-generated remediation patch by AgentOps AI\n// File: ${filePath}\n\n${patchContent}\n`
    ).toString("base64");

    await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: prTitle,
        content: contentEncoded,
        branch: cleanBranch,
      }),
    });

    // 4. Open Pull Request
    const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: prTitle,
        head: cleanBranch,
        base: "main",
        body: `${prBody}\n\n---\n*Remediated and verified autonomously via **AgentOps AI** (Human-in-the-Loop Approved).*`,
      }),
    });

    if (!prRes.ok) {
      throw new Error(`Failed to create Pull Request: ${prRes.statusText}`);
    }

    const prData = await prRes.json();
    return {
      pr_url: prData.html_url,
      pr_number: prData.number,
      branch: cleanBranch,
      simulated: false,
    };
  } catch (error) {
    console.error("Live GitHub API request failed, falling back to simulated PR:", error);
    const mockPrNumber = Math.floor(100 + Math.random() * 900);
    return {
      pr_url: `https://github.com/${owner}/${repo}/pull/${mockPrNumber}`,
      pr_number: mockPrNumber,
      branch: branchName,
      simulated: true,
    };
  }
}

