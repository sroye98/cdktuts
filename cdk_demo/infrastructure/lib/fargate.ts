import * as cdk from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";

export class FargateDemoStack extends cdk.Stack {
    constructor (
        scope: cdk.App, 
        id: string, 
        props?: cdk.StackProps) {
        super(
            scope, 
            id, 
            props);

        // VPC
        const vpc = new Vpc(
            this, 
            "youtubeVPC",
            {
                maxAzs: 2,
                natGateways: 1
            }
        );

        // Fargate Cluster
        const cluster = new ecs.Cluster(
            this,
            "youtubeCluster",
            {
                vpc: vpc as any
            }
        )

        // Fargat Service
        const backendService = new ecs_patterns.ApplicationLoadBalancedFargateService(
            this,
            "backendService",
            {
                cluster: cluster,
                memoryLimitMiB: 1024,
                cpu: 512,
                desiredCount: 2,
                taskImageOptions: {
                    image: ecs.ContainerImage.fromAsset("../backend"),
                    environment: {
                        myVar: "variable01"
                    }
                }
            }
        );

        // Health Check
        backendService.targetGroup.configureHealthCheck(
            {
                path: "/health"
            }
        );

        // Load Balancer Url
        new cdk.CfnOutput(
            this,
            "loadBalancerUrl",
            {
                value: backendService.loadBalancer.loadBalancerDnsName,
                exportName: "loadBalancerUrl"
            }
        )
    }
}