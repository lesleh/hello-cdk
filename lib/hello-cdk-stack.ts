import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_s3 as s3,
  aws_s3_deployment as s3Deployment,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
} from "aws-cdk-lib";

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "MyFirstBucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
    });

    new s3Deployment.BucketDeployment(this, "DeployWebsite", {
      sources: [s3Deployment.Source.asset("./public")],
      destinationBucket: bucket,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, "OAI");
    bucket.grantRead(oai); // Grant read access to the bucket

    const distro = new cloudfront.CloudFrontWebDistribution(
      this,
      "MyDistribution",
      {
        httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: bucket,
              originAccessIdentity: oai,
            },
            behaviors: [{ isDefaultBehavior: true, compress: true }],
          },
        ],
      },
    );

    // print the cloudfront domain name
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: "https://" + distro.distributionDomainName,
    });
  }
}
