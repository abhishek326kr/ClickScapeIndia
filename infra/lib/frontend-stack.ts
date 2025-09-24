import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'

export interface FrontendStackProps extends cdk.StackProps {
  domainName?: string
  cloudfrontPriceClass?: cloudfront.PriceClass | string
}

export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket
  public readonly distribution: cloudfront.Distribution

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props)

    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    })

    this.distribution = new cloudfront.Distribution(this, 'FrontendCdn', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: (props.cloudfrontPriceClass as cloudfront.PriceClass) ?? cloudfront.PriceClass.PRICE_CLASS_100,
      defaultRootObject: 'index.html',
    })

    new cdk.CfnOutput(this, 'FrontendBucketName', { value: this.bucket.bucketName })
    new cdk.CfnOutput(this, 'CloudFrontDomain', { value: this.distribution.distributionDomainName })

    // Optional: simple deploy command target (for local testing)
    // Usage: after building frontend, run cdk deploy, then use aws s3 sync to upload.
    // Or uncomment the below to let CDK deploy assets from ../frontend/dist on synth.
    // new s3deploy.BucketDeployment(this, 'DeployFrontend', {
    //   sources: [s3deploy.Source.asset('../frontend/dist')],
    //   destinationBucket: this.bucket,
    //   distribution: this.distribution,
    //   distributionPaths: ['/*'],
    // })
  }
}
