const github = require('@actions/github');
const querystring = require('querystring');
const axios = require('axios');

const TIMEOUT_MS = 10000;

async function run() {
  const backlogSpaceName = process.env.BACKLOG_SPACE_NAME;
  const backlogSpaceDomain = process.env.BACKLOG_SPACE_DOMAIN;
  const backlogApiKey = process.env.BACKLOG_API_KEY;
  const backlogProjectKey = process.env.BACKLOG_PROJECT_KEY;
  const backlogCustomFieldId = process.env.BACKLOG_CUSTOM_FIELD_ID;

  const { context } = github;
  const pr = context.payload.pull_request;
  const prBody = pr.body;

  if (!prBody) {
    console.log('PR本文が空です。処理を終了します。');
    return;
  }

  const backlogIssueMatches = [...prBody.matchAll(new RegExp(`https?:\/\/[^\s]*${backlogSpaceName}\.${backlogSpaceDomain}\/view\/(${backlogProjectKey}-\\d+)`, 'g'))];

  console.log('BACKLOG_SPACE_NAME:', backlogSpaceName);
  console.log('BACKLOG_SPACE_DOMAIN:', backlogSpaceDomain);
  console.log('BACKLOG_PROJECT_KEY:', backlogProjectKey);
  console.log('BACKLOG_CUSTOM_FIELD_ID:', backlogCustomFieldId);

  for (const backlogIssueMatch of backlogIssueMatches) {
    const backlogIssueKey = backlogIssueMatch[1];
    const backlogIssueUrl = `https://${backlogSpaceName}.${backlogSpaceDomain}/api/v2/issues/${backlogIssueKey}?apiKey=${backlogApiKey}`;
    try {
      const currentIssueDetails = await axios.get(backlogIssueUrl, { timeout: TIMEOUT_MS });
      let currentCustomFieldValue = currentIssueDetails.data.customFields.find(field => field.id === Number(backlogCustomFieldId)).value;
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
      const data = querystring.stringify({ [`customField_${backlogCustomFieldId}`]: currentCustomFieldValue });
      await axios.patch(backlogIssueUrl, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: TIMEOUT_MS
      });
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.error(`リクエストがタイムアウトしました: ${error}`);
      } else {
        console.error(`Backlog課題の更新に失敗しました: ${error}`);
      }
    }
  }
}

run();
