import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class MirrorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const logBucket = new s3.Bucket(this, 'MirrorEngineLogBucket', {
      bucketName: '445307590870-mirror-engine-logs', // optional: leave blank to auto-generate unique name
      removalPolicy: cdk.RemovalPolicy.RETAIN, // keep data even if stack is deleted
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const mirrorLambda = new NodejsFunction(this, 'MirrorHandler', {
      entry: 'src/lambda/handler.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: [], // bundle everything including openai
      },
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
    });

    mirrorLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: ['*'] // or scope to your secret ARN
    }));
    
    logBucket.grantReadWrite(mirrorLambda);

    new apigateway.LambdaRestApi(this, 'MirrorApi', {
      handler: mirrorLambda,
      proxy: true
    });
  }
}

// Entrypoint
const app = new cdk.App();
new MirrorStack(app, 'MirrorEngineAlpha', {
  env: {
    region: 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  }
});
