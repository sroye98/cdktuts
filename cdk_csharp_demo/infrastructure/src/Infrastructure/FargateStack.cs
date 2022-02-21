using Amazon.CDK;
using Amazon.CDK.AWS.EC2;
using Amazon.CDK.AWS.ECS;
using Amazon.CDK.AWS.ECS.Patterns;
using Constructs;

namespace Infrastructure
{
    public class FargateStack : Stack
    {
        internal FargateStack(
            Construct scope, 
            string id, 
            IStackProps props = null) : 
            base(scope, id, props)
        {
            // VPC
            var vpc = new Vpc(
                this, 
                "youtubeVPC", 
                new VpcProps 
                {
                    MaxAzs = 2,
                    NatGateways = 2
                });

            // Fargate Cluster
            var cluster = new Cluster(
                this,
                "youtubeCluster",
                new ClusterProps 
                {
                    Vpc = vpc
                }
            );

            // Fargate Service
            var backendService = new ApplicationLoadBalancedFargateService(
                this,
                "backendService",
                new ApplicationLoadBalancedFargateServiceProps
                {
                    Cluster = cluster,
                    MemoryLimitMiB = 1024,
                    Cpu = 512,
                    DesiredCount = 2,
                    TaskImageOptions = new ApplicationLoadBalancedTaskImageOptions
                    {
                        Image = ContainerImage.FromAsset("../backend"),
                        Environment = {
                            { "myVar", "variable01" }
                        }
                    }
                }
            );

            // Health Check
            backendService.TargetGroup.ConfigureHealthCheck(
                new Amazon.CDK.AWS.ElasticLoadBalancingV2.HealthCheck
                {
                    Path = "/health"
                }
            );

            // Load Balancer Url
            new CfnOutput(
                this,
                "loadBalanceUrl",
                new CfnOutputProps
                {
                    Value = backendService.LoadBalancer.LoadBalancerDnsName,
                    ExportName = "loadBalancerUrl"
                }
            );
        }
    }
}