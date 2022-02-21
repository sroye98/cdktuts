using Amazon.CDK;

namespace Infrastructure
{
    sealed class Program
    {
        public static void Main(string[] args)
        {
            var app = new App();

            string account = System.Environment.GetEnvironmentVariable(Constants.AccountId);
            string certificateArn = System.Environment.GetEnvironmentVariable(Constants.CertificateArn);
            string region = System.Environment.GetEnvironmentVariable(Constants.Region);

            new CloudfrontStack(
                app, 
                "CloudfrontStack", 
                new CustomStackProps {
                    CertificateArn = certificateArn,
                    Env = new Amazon.CDK.Environment
                    {
                        Account = account,
                        Region = region,
                    }
                }
            );

            new FargateStack(
                app,
                "FargateStack",
                new StackProps
                {
                    Env = new Amazon.CDK.Environment
                    {
                        Account = account,
                        Region = region
                    }
                }
            );

            app.Synth();
        }
    }
}
