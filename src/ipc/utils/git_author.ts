import { getGithubUser } from "../handlers/github_handlers";

export async function getGitAuthor() {
  const user = await getGithubUser();
  const author = user
    ? {
        name: `[nati]`,
        email: user.email,
      }
    : {
        name: "[nati]",
        email: "git@dyad.sh",
      };
  return author;
}
