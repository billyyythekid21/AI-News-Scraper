import os

import requests


def fetch_github_repos(username: str) -> str | None:
    """
    Fetches the GitHub user's repos and builds a text blob from their
    names, descriptions, and languages (for embedding).
    Returns None if the user is not found or the request fails.
    """
    token = os.getenv("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        url = f"https://api.github.com/users/{username}/repos"
        response = requests.get(
            url,
            headers=headers,
            params={"sort": "updated", "per_page": 30},
        )

        if response.status_code == 404:
            return None

        response.raise_for_status()
        repos = response.json()
        repos = build_github_repos_data(repos)

        parts = []
        languages = set()

        for repo in repos:
            if repo["description"]:
                parts.append(f"{repo['name']}: {repo['description']}")
            else:
                parts.append(f"{repo['name']}")
            if repo["language"]:
                languages.add(repo["language"])

        languages_str = ", ".join(sorted(languages))
        text = f"Languages: {languages_str}. Repos: {'. '.join(parts)}"

        return text

    except requests.exceptions.RequestException as e:
        print(f"Error getting GitHub user info: {e}")
        return None


def build_github_repos_data(repos: list) -> list:
    """
    Builds the GitHub repos data, skipping forks (not the user's own work).
    """
    repos_data = []
    for repo in repos:
        if repo.get("fork"):
            continue
        repo_data = {
            "name": repo["name"],
            "description": repo["description"],
            "language": repo["language"],
        }
        repos_data.append(repo_data)
    return repos_data
