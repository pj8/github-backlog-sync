const querystring = require('querystring');
const axios = require('axios');
const github = require('@actions/github');

(async () => {
  // test
  // const context = {
  //   payload: {
  //     pull_request: {
  //       body: 'Here is the body of the PR. https://spaceName.backlog.jp/view/projectKey-4',
  //       html_url: 'https://github.com/org/repo/pull/1',
  //     },
  //   },
  // };
  const { context } = github;
  const pr = context.payload.pull_request;
  const prBody = pr.body;
  const backlogIssueMatch = prBody.match(new RegExp(`https?:\/\/[^\s]*${process.env.BACKLOG_SPACE_NAME}\.backlog\.jp\/view\/(${process.env.BACKLOG_PROJECT_KEY}-\\d+)`));

  if (backlogIssueMatch) {
    const backlogIssueKey = backlogIssueMatch[1];
    const backlogIssueUrl = `https://${process.env.BACKLOG_SPACE_NAME}.backlog.jp/api/v2/issues/${backlogIssueKey}?apiKey=${process.env.BACKLOG_API_KEY}`;
    try {
      const currentIssueDetails = await axios.get(backlogIssueUrl);
      const currentCustomFieldValue = currentIssueDetails.data.customFields.find(field => field.id === Number(process.env.BACKLOG_CUSTOM_FIELD_ID)).value;
      if (currentCustomFieldValue !== pr.html_url) {
        const data = querystring.stringify({ [`customField_${process.env.BACKLOG_CUSTOM_FIELD_ID}`]: pr.html_url });
        await axios.patch(backlogIssueUrl, data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      }
    } catch (error) {
      console.error(`Failed to update Backlog issue: ${error}`);
    }
  }
})();
