
#IAM role for Lambda execution defined here

data "aws_iam_policy_document" "lambda_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exe_role" {
  assume_role_policy = data.aws_iam_policy_document.lambda_trust.json
  name               = "raas-${var.environment}-lambda-execution-role"

}

data "aws_iam_policy_document" "lambda_exe_policy_doc" {
  statement {
    actions = [
      "ec2:DescribeInstances",
      "ec2:RebootInstances",
      "ec2:StartInstances",
      "ec2:StopInstances",
      "ec2:DescribeTags"
    ]
    resources = ["*"]
    effect    = "Allow"
  }

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["*"]
    effect    = "Allow"
  }
}


resource "aws_iam_role_policy" "lambda_exec_policy" {
  name   = "${aws_iam_role.lambda_exe_role.name}-Inline"
  role   = aws_iam_role.lambda_exe_role.name
  policy = data.aws_iam_policy_document.lambda_exe_policy_doc.json
}
