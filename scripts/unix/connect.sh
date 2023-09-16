#!/bin/sh

###############################################################################
# Connects to EC2 proxy using instance connect approach.
# See https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Connect-using-EC2-Instance-Connect.html
#
# usage eg.: ./scripts/unix/connect.sh
###############################################################################

FORWARDED_PORT=3128
AWS_REGION=eu-central-1


echo "Retrieving EC2 proxy information."

ec2_instance_id=$(aws ec2 describe-instances \
  --filters Name=tag:Name,Values=proxy-instance Name=instance-state-name,Values=running \
  --output text --query 'Reservations[*].Instances[*].InstanceId')

ec2_az=$(aws ec2 describe-instances \
                --filters Name=tag:Name,Values=proxy-instance Name=instance-state-name,Values=running \
                --output text --query 'Reservations[*].Instances[*].Placement.AvailabilityZone')


echo "Generating temporary keys"

TMP=$(mktemp -u key.XXXXXX)".pem"

ssh-keygen -t rsa -f "$TMP" -N "" -q -m PEM

echo "Sending ssh public key to EC2 in ${AWS_REGION} on AZ ${ec2_az} and EC2 instance id ${ec2_instance_id}"

aws ec2-instance-connect send-ssh-public-key \
  --region ${AWS_REGION} \
  --instance-id ${ec2_instance_id} \
  --availability-zone ${ec2_az} \
  --instance-os-user ec2-user \
  --ssh-public-key "file://$TMP.pub"

ssh -i $TMP \
      -Nf -M \
      -L ${FORWARDED_PORT}:localhost:${FORWARDED_PORT} \
      -o "UserKnownHostsFile=/dev/null" \
      -o "StrictHostKeyChecking=no" \
      -o IdentitiesOnly=yes \
      -o ProxyCommand="aws ssm start-session --target %h --document AWS-StartSSHSession --parameters portNumber=%p --region=eu-central-1" \
      ec2-user@${ec2_instance_id}

echo "Forwarding to localhost:${FORWARDED_PORT}"

rm $TMP "$TMP.pub"


