const core = require('@actions/core');
const { Octokit } = require("@octokit/rest");

const repository = core.getInput('repository');
let owner = core.getInput('owner');
let repo = core.getInput('repo');
const and_filters = core.getInput('and_filters').trim().split(",").map(x => x.trim());
const token = core.getInput('token');
const regex_filters = core.getInput('regex_filters').trim().split(",").map(x => x.trim());

const octokit = (token ? new Octokit({ auth: token }) : new Octokit());

async function run() {
    let i = 1;
    while (true) {
        try {
            if (repository) {
                [owner, repo] = repository.split("/");
            }
            let releases = await octokit.repos.listReleases({
                owner: owner,
                repo: repo,
                per_page: 100,
                page: i++
            });
            releases = releases.data;
            if (!releases || releases.length === 0) {
                core.setFailed("No valid releases");
                return;
            }
            if (and_filters.length)
                and_filters.forEach(element => {
                    let [key, value] = element.split(":").map(x => x.trim());
                    if (key)
                        releases = releases.filter(x => x[key].toString().includes(value));
                });
            if (regex_filters.length)
                regex_filters.forEach(element => {
                    let [key, value] = element.split(":").map(x => x.trim());
                    if (key) {
                        if (value[0] != '/') core.setFailed('invalid regex');
                        const i = value.lastIndexOf('/');
                        if (i <= 0) core.setFailed('invalid regex');
                        const regex = new RegExp(value.slice(1, i), value.slice(i + 1));
                        releases = releases.filter(x => regex.test(x[key].toString()));
                    }
                });
            if (releases.length) {
                core.setOutput('url', releases[0].url);
                core.setOutput('assets_url', releases[0].assets_url);
                core.setOutput('upload_url', releases[0].upload_url);
                core.setOutput('html_url', releases[0].html_url);
                core.setOutput('id', releases[0].id.toString());
                core.setOutput('node_id', releases[0].node_id);
                core.setOutput('tag_name', releases[0].tag_name);
                core.setOutput('target_commitish', releases[0].target_commitish);
                core.setOutput('name', releases[0].name);
                core.setOutput('body', releases[0].body);
                core.setOutput('draft', releases[0].draft.toString());
                core.setOutput('prerelease', releases[0].prerelease.toString());
                core.setOutput('author_id', releases[0].author.id.toString());
                core.setOutput('author_node_id', releases[0].author.node_id);
                core.setOutput('author_url', releases[0].author.url);
                core.setOutput('author_login', releases[0].author.login);
                core.setOutput('author_html_url', releases[0].author.html_url);
                core.setOutput('author_type', releases[0].author.type);
                core.setOutput('author_site_admin', releases[0].author.site_admin.toString());
                core.setOutput('release_url', releases[0].html_url + '/releases/tag/' + releases[0].name);
                core.info("Latest release tag: " + releases[0].tag_name);
                return;
            }
        }
        catch (error) {
            core.setFailed(error.message);
            return;
        }
    }
}

run()
