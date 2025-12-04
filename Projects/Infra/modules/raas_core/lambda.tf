data "archive_file" "lambda_package" {
  type        = "zip"
  source_file = "${path.module}/lambda/index.js"
  output_path = "${path.module}/lambda/function.zip"
}

# Lambda function definition
resource "aws_lambda_function" "lambda_function_def" {
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "raas-lambda_function"
  role             = aws_iam_role.lambda_exe_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256

  runtime = "nodejs20.x"

  environment {
    variables = {
      ENVIRONMENT = "dev"
      LOG_LEVEL   = "info"
    }
  }

  tags = {
    Environment = "dev"
    Application = "RaaS"
  }
}