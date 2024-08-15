const querystring = require('querystring');
const axios = require('axios');
const github = require('@actions/github');

const TIMEOUT_MS = 10000;

(async () => {
  const { context } = github;
  const pr = context.payload.pull_request;
  const prBody = pr.body;

  if (!prBody) {
    return;
  }

  const backlogIssueMatches = [...prBody.matchAll(new RegExp(`https?:\/\/[^\s]*${process.env.BACKLOG_SPACE_NAME}\.backlog\.jp\/view\/(${process.env.BACKLOG_PROJECT_KEY}-\\d+)`, 'g'))];

  console.log('BACKLOG_SPACE_NAME:', process.env.BACKLOG_SPACE_NAME);
  console.log('BACKLOG_PROJECT_KEY:', process.env.BACKLOG_PROJECT_KEY);
  console.log('BACKLOG_CUSTOM_FIELD_ID:', process.env.BACKLOG_CUSTOM_FIELD_ID);

  for (const backlogIssueMatch of backlogIssueMatches) {
    const backlogIssueKey = backlogIssueMatch[1];
    const backlogIssueUrl = `https://${process.env.BACKLOG_SPACE_NAME}.backlog.jp/api/v2/issues/${backlogIssueKey}?apiKey=${process.env.BACKLOG_API_KEY}`;
    try {
      const currentIssueDetails = await axios.get(backlogIssueUrl, { timeout: TIMEOUT_MS });
      let currentCustomFieldValue = currentIssueDetails.data.customFields.find(field => field.id === Number(process.env.BACKLOG_CUSTOM_FIELD_ID)).value;
      if (currentCustomFieldValue !== null) {
        const lines = currentCustomFieldValue.split('\n');
        if (lines.some(line => line === pr.html_url)) {
          continue;
        }
      }

      console.log(`Update backlogIssueKey: ${backlogIssueKey}`);
      if (currentCustomFieldValue === null) {
        currentCustomFieldValue = `${pr.html_url}`;
      } else {
        currentCustomFieldValue += `\n${pr.html_url}`;
      }
      const data = querystring.stringify({ [`customField_${process.env.BACKLOG_CUSTOM_FIELD_ID}`]: currentCustomFieldValue });
      await axios.patch(backlogIssueUrl, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: TIMEOUT_MS
      });
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.error(`The request timed out: ${error}`);
      } else {
        console.error(`Failed to update Backlog issue: ${error}`);
      }
    }
  }
})();
