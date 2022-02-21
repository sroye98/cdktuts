using Amazon.CDK;
using Amazon.CDK.AWS.CloudFront;
using Amazon.CDK.AWS.CloudFront.Origins;
using Amazon.CDK.AWS.S3;
using Amazon.CDK.AWS.S3.Deployment;
using Constructs;

namespace Infrastructure
{
    public class CustomStackProps : IStackProps
    {
        public string CertificateArn { get; set; }

        public Amazon.CDK.Environment Env { get; set; }
    }

    public class CloudfrontStack : Stack
    {
        internal CloudfrontStack(
            Construct scope, 
            string id, 
            CustomStackProps props = null) : 
            base(scope, id, props)
        {
            // Importing ALB Domain Name
            var loadBalancerDomain = Fn.ImportValue("loadBalancerUrl");

            // SSL Certificate
            var certificateArn = Amazon.CDK.AWS.CertificateManager.Certificate.FromCertificateArn(
                this,
                "tlsCertificate",
                props.CertificateArn
            );

            // Website Hosting Bucket
            var websiteBucket = new Bucket(
                this,
                "websiteBucket",
                new BucketProps
                {
                    Versioned = false,
                    RemovalPolicy = RemovalPolicy.DESTROY
                }
            );

            // Trigger Frontend Deployment
            new BucketDeployment(
                this,
                "websiteDeployment",
                new BucketDeploymentProps
                {
                    Sources = new ISource[] { Source.Asset("../frontend") },
                    DestinationBucket = websiteBucket
                }
            );

            // Create Origin Access Identity for Cloudfront
            var originAccessIdentity = new OriginAccessIdentity(
                this,
                "cloudfrontOAI",
                new OriginAccessIdentityProps
                {
                    Comment = "OAI for web application cloudfront distribution"
                }
            );

            // Creating Cloudfront Distribution
            var cloudfrontDist = new Distribution(
                this,
                "cloudfrontDist",
                new DistributionProps
                {
                    DefaultRootObject = "index.html",
                    DomainNames = new string[] { "enlearnacademy.tk" },
                    Certificate = certificateArn,
                    DefaultBehavior = new BehaviorOptions
                    {
                        Origin = new S3Origin(
                            websiteBucket, 
                            new S3OriginProps 
                            {
                                OriginAccessIdentity = originAccessIdentity 
                            })
                    }
                }
            );

            // Creating Custom Origin for the Application Load Balancer
            var loadBalancerOrigin = new HttpOrigin(
                loadBalancerDomain,
                new HttpOriginProps
                {
                    ProtocolPolicy = OriginProtocolPolicy.HTTP_ONLY
                }
            );

            new CfnOutput(
                this,
                "cloudfrontDomainUrl",
                new CfnOutputProps
                {
                    Value = cloudfrontDist.DistributionDomainName,
                    ExportName = "cloudfrontDomainUrl"
                }
            );
        }
    }
}