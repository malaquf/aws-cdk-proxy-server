@echo off

set FORWARDED_PORT=3128
set AWS_REGION=eu-central-1

echo Retrieving EC2 proxy information.

for /f %%i in ('aws ec2 describe-instances ^
  --filters Name=tag:Name,Values=proxy-instance Name=instance-state-name,Values=running ^
  --output text --query "Reservations[*].Instances[*].InstanceId"') do set ec2_instance_id=%%i

for /f %%a in ('aws ec2 describe-instances ^
                --filters Name=tag:Name,Values=proxy-instance Name=instance-state-name,Values=running ^
                --output text --query "Reservations[*].Instances[*].Placement.AvailabilityZone"') do set ec2_az=%%a

echo Generating temporary keys

set TMP=%TEMP%\key_%RANDOM%.pem

ssh-keygen -t rsa -f "%TMP%" -N "" -q -m PEM

echo Sending ssh public key to EC2 in %AWS_REGION% on AZ %ec2_az% and EC2 instance id %ec2_instance_id%

aws ec2-instance-connect send-ssh-public-key ^
  --region %AWS_REGION% ^
  --instance-id %ec2_instance_id% ^
  --availability-zone %ec2_az% ^
  --instance-os-user ec2-user ^
  --ssh-public-key "file://%TMP%.pub"

ssh -i "%TMP%" ^
      -Nf -M ^
      -L %FORWARDED_PORT%:localhost:%FORWARDED_PORT% ^
      -o "UserKnownHostsFile=NUL" ^
      -o "StrictHostKeyChecking=no" ^
      -o IdentitiesOnly=yes ^
      -o ProxyCommand="aws ssm start-session --target %%h --document AWS-StartSSHSession --parameters portNumber=%%p --region=eu-central-1" ^
      ec2-user@%ec2_instance_id%

echo Forwarding to localhost:%FORWARDED_PORT%

del "%TMP%" "%TMP%.pub"
