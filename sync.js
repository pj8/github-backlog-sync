const querystring = require('querystring');
const axios = require('axios');
const github = require('@actions/github');

(async () => {
  // test
  // const context = {
  //   payload: {
  //     pull_request: {
  //       body: '',
  //       html_url: '',
  //     },
  //   },
  // };

  // production
  const { context } = github;

  const pr = context.payload.pull_request;
  const prBody = pr.body;
  const backlogIssueMatch = prBody.match(new RegExp(`https?:\/\/[^\s]*${process.env.BACKLOG_SPACE_NAME}\.backlog\.jp\/view\/(${process.env.BACKLOG_PROJECT_KEY}-\\d+)`));

  if (backlogIssueMatch) {
    const backlogIssueKey = backlogIssueMatch[1];
    const backlogIssueUrl = `https://${process.env.BACKLOG_SPACE_NAME}.backlog.jp/api/v2/issues/${backlogIssueKey}?apiKey=${process.env.BACKLOG_API_KEY}`;
    try {
      const currentIssueDetails = await axios.get(backlogIssueUrl);
      let currentCustomFieldValue = currentIssueDetails.data.customFields.find(field => field.id === Number(process.env.BACKLOG_CUSTOM_FIELD_ID)).value;
      const lines = currentCustomFieldValue.split('\n');

      if (lines.some(line => line === pr.html_url)) {
        return; // Early return if the URL is already in the custom field.
      }

      // Add new URL and update the issue if the URL is not in the custom field.
      currentCustomFieldValue += `\n${pr.html_url}`;
      const data = querystring.stringify({ [`customField_${process.env.BACKLOG_CUSTOM_FIELD_ID}`]: currentCustomFieldValue });
      await axios.patch(backlogIssueUrl, data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    } catch (error) {
      console.error(`Failed to update Backlog issue: ${error}`);
    }
  }
})();
