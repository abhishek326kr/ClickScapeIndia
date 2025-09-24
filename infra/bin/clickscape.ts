#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';
import { EcrStack } from '../lib/ecr-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-south-1',
};

// Parameters (can be configured via context or env)
const domainName = app.node.tryGetContext('domainName') || undefined; // e.g. app.example.com
const priceClass = app.node.tryGetContext('cloudfrontPriceClass') || 'PriceClass_100';

new FrontendStack(app, 'ClickScape-Frontend', {
  env,
  domainName,
  cloudfrontPriceClass: priceClass,
});

new EcrStack(app, 'ClickScape-ECR', {
  env,
  repositoryName: 'clickscape-backend',
});
