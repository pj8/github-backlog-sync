const querystring = require('querystring');
const axios = require('axios');
const github = require('@actions/github');

(async () => {
  const { context } = github;
  const pr = context.payload.pull_request;
  const prBody = pr.body;
  const backlogIssueMatch = prBody.match(new RegExp(`https?:\/\/[^\s]*${process.env.BACKLOG_SPACE_NAME}\.backlog\.jp\/view\/(${process.env.BACKLOG_PROJECT_KEY}-\\d+)`));

  console.log('BACKLOG_SPACE_NAME:', process.env.BACKLOG_SPACE_NAME);
  console.log('BACKLOG_PROJECT_KEY:', process.env.BACKLOG_PROJECT_KEY);
  console.log('BACKLOG_CUSTOM_FIELD_ID:', process.env.BACKLOG_CUSTOM_FIELD_ID);
  console.log("call backlogIssueMatch()");

  if (backlogIssueMatch) {
    console.log("matched!");
    const backlogIssueKey = backlogIssueMatch[1];
    console.log(`backlogIssueKey: ${backlogIssueKey}`);
    const backlogIssueUrl = `https://${process.env.BACKLOG_SPACE_NAME}.backlog.jp/api/v2/issues/${backlogIssueKey}?apiKey=${process.env.BACKLOG_API_KEY}`;
    try {
      const currentIssueDetails = await axios.get(backlogIssueUrl);
      let currentCustomFieldValue = currentIssueDetails.data.customFields.find(field => field.id === Number(process.env.BACKLOG_CUSTOM_FIELD_ID)).value;
      const lines = currentCustomFieldValue.split('\n');

      if (lines.some(line => line === pr.html_url)) {
        console.log(`The URL is already in the custom field: ${pr.html_url}`);
        return; // Early return if the URL is already in the custom field.
      }

      // Add new URL and update the issue if the URL is not in the custom field.
      currentCustomFieldValue += `\n${pr.html_url}`;
      const data = querystring.stringify({ [`customField_${process.env.BACKLOG_CUSTOM_FIELD_ID}`]: currentCustomFieldValue });
      console.log(`data: ${data}`);
      await axios.patch(backlogIssueUrl, data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    } catch (error) {
      console.error(`Failed to update Backlog issue: ${error}`);
    }
  }
})();