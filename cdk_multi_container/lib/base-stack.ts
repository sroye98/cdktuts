import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as serviceDiscovery from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";

interface BaseStackProps extends cdk.StackProps {
    vpcId: string;
    vpcName: string;
    clusterId: string;
    clusterName: string;
    albId: string;
    albName: string;
    securityGroupId: string;
    listener80Id: string;
    namespaceId: string;
    namespaceName: string;
}

export class BaseStack extends cdk.Stack {
    public readonly vpc: ec2.IVpc; 
    public readonly cluster: ecs.ICluster;
    public readonly alb: elb.IApplicationLoadBalancer;
    public readonly securityGroup: ec2.SecurityGroup;
    public readonly listener: elb.IApplicationListener;
    public readonly namespace: serviceDiscovery.PrivateDnsNamespace;

    constructor(scope: Construct, id: string, props?: BaseStackProps) {
        super(scope, id, props);

        this.vpc = new ec2.Vpc(this, props?.vpcId!, {
            maxAzs: 2,
            vpcName: props?.vpcName,
        });

        this.cluster = new ecs.Cluster(this, props?.clusterId!, {
            vpc: this.vpc,
            clusterName: props?.clusterName
        });

        this.alb = new elb.ApplicationLoadBalancer(this, props?.albId!, {
            vpc: this.vpc,
            internetFacing: true,
            loadBalancerName: props?.albName!
        });

        this.securityGroup = new ec2.SecurityGroup(this, props?.securityGroupId!, {
            vpc: this.vpc,
            allowAllOutbound: true
        });

        this.listener = this.alb.addListener(props?.listener80Id!, { 
            port: 80 
        });

        this.listener.addAction("/", {
            action: elb.ListenerAction.fixedResponse(200, {
                contentType: "application/json",
                messageBody: "{ \"msg\": \"base route\" }"
            })
        });

        this.namespace = new serviceDiscovery.PrivateDnsNamespace(this, props?.namespaceId!,
        {
            name: props?.namespaceName!,
            vpc: this.vpc
        });
    }
}