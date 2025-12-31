#EC2 instances created here
module "ec2_instance" {
  source = "terraform-aws-modules/ec2-instance/aws"

  for_each = var.instance_map

  name = "instance-${each.key}"

  instance_type = "t2.micro"
  //key_name      = "user1"
  //monitoring    = true
  ami                    = data.aws_ssm_parameter.ubuntu-focal.value
  subnet_id              = data.aws_subnets.raas_network_subnets.ids[0]
  vpc_security_group_ids = [aws_security_group.raas_network_sg.id]


  tags = {
    Terraform   = "true"
    Environment = "dev"

    # REQUIRED FOR RaaS SECURITY updated here
    OwnerGroup = each.value.team
  }

}

data "aws_ssm_parameter" "ubuntu-focal" {
  name = "/aws/service/canonical/ubuntu/server/20.04/stable/current/amd64/hvm/ebs-gp2/ami-id"
}

#Default VPC created here
data "aws_vpc" "raas_network_vpc" {
  default = true
}

data "aws_subnets" "raas_network_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.raas_network_vpc.id]
  }
}

resource "aws_security_group" "raas_network_sg" {
  name        = "raas-default-sg"
  description = "Security group for RaaS default VPC"
  vpc_id      = data.aws_vpc.raas_network_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]

  }
  revoke_rules_on_delete = true

  tags = {
    Name        = "raas-default-sg"
    Environment = var.environment
  }

}
