import assert from "node:assert/strict";
import test from "node:test";
import { siteUrl } from "./content";
import { previewUrl, proposalBaseUrl, publicUrl } from "./proposals";
import { shouldRedirectVercelProposalPath } from "../proxy";

test("proposal links stay on oracleoffreedom.com when the request host is vercel.app", () => {
  const deploymentHost = "https://oracle-of-freedom.vercel.app";
  assert.equal(publicUrl("norte-nosara", deploymentHost), "https://oracleoffreedom.com/p/norte-nosara");
  assert.equal(
    previewUrl("norte-nosara", "norte-example-preview", deploymentHost),
    "https://oracleoffreedom.com/p/norte-nosara?preview=norte-example-preview",
  );
});

test("proposalBaseUrl never returns a vercel.app origin", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://oracle-of-freedom.vercel.app";
  try {
    assert.equal(proposalBaseUrl(), "https://oracleoffreedom.com");
    assert.equal(siteUrl(), "https://oracleoffreedom.com");
    assert.equal(publicUrl("demo"), "https://oracleoffreedom.com/p/demo");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("preview branch vercel.app hosts are also rewritten for client links", () => {
  assert.equal(
    publicUrl("client", "https://oracle-of-freedom-git-main-team.vercel.app"),
    "https://oracleoffreedom.com/p/client",
  );
});

test("only the production vercel.app alias redirects /p paths", () => {
  assert.equal(shouldRedirectVercelProposalPath("oracle-of-freedom.vercel.app", "/p/norte-nosara"), true);
  assert.equal(shouldRedirectVercelProposalPath("oracle-of-freedom.vercel.app", "/p"), true);
  assert.equal(
    shouldRedirectVercelProposalPath("oracle-of-freedom-git-feat-team.vercel.app", "/p/norte-nosara"),
    false,
  );
  assert.equal(shouldRedirectVercelProposalPath("oracle-of-freedom.vercel.app", "/admin/proposals"), false);
  assert.equal(shouldRedirectVercelProposalPath("oracleoffreedom.com", "/p/norte-nosara"), false);
});
