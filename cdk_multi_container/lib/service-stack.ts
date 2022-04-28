import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as serviceDiscovery from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";

interface ServiceStackProps extends cdk.StackProps {
    cluster: ecs.ICluster;
    securityGroup: ec2.SecurityGroup;
    listener: elb.IApplicationListener;
    namespace: serviceDiscovery.PrivateDnsNamespace;
    taskDefinitionId: string;
    containerId: string;
    containerName: string;
    containerLoggingName: string;
    serviceId: string;
    serviceName: string;
    listenerTargetId: string;
    targetGroupName: string;
    pathPattern: string;
    priority: number;
    cloudMapName: string;
}

export class ServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: ServiceStackProps) {
        super(scope, id, props);

        const image = ecs.ContainerImage.fromRegistry("traefik/whoami");
      
        const taskDefinition = new ecs.FargateTaskDefinition(this, props?.taskDefinitionId!, {
            cpu: 256,
            memoryLimitMiB: 512
        });
        
        const container = taskDefinition.addContainer(props?.containerId!, {
            containerName: props?.containerName!,
            image: image,
            logging: ecs.LogDriver.awsLogs({ 
                streamPrefix: props?.containerLoggingName! 
            }),
        });
        container.addPortMappings({
            containerPort: 80,
            protocol: ecs.Protocol.TCP
        });
        
        const service = new ecs.FargateService(this, props?.serviceId!, {
            cluster: props?.cluster!,
            taskDefinition: taskDefinition,
            serviceName: props?.serviceName!,
            securityGroups: [props?.securityGroup!],
            cloudMapOptions: {
                name: props?.cloudMapName,
                cloudMapNamespace: props?.namespace,
                dnsRecordType: serviceDiscovery.DnsRecordType.A
            }
        });
      
        service.connections.allowFrom(
            props?.securityGroup!,
            ec2.Port.tcp(80), 
            "Allow traffic within security group on 80");
      
        props?.listener!.addTargets(props?.listenerTargetId!, {
            targetGroupName: props?.targetGroupName!,
            port: 80,
            targets: [service],
            priority: props?.priority,
            conditions: [elb.ListenerCondition.pathPatterns([`${props?.pathPattern}*`])],
            healthCheck: {
                interval: cdk.Duration.seconds(60),
                path: props?.pathPattern!,
                timeout: cdk.Duration.seconds(5)
            }
        });
    }
}