
#Frontend S3 Bucket creation and configuration

resource "aws_s3_bucket" "raas_frontend_bucket" {
  bucket = "raas-frontend-${var.environment}"

  tags = {
    Name        = "RaaS Frontend Bucket"
    Environment = "${var.environment}"
  }
}

resource "aws_s3_bucket_public_access_block" "raas_frontend_bucket" {
  bucket = aws_s3_bucket.raas_frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "raas_front_bucket_policy_document" {
  statement {
    effect = "Allow"
    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",

    ]

    resources = [
      "${aws_s3_bucket.raas_frontend_bucket.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_policy" "raas_frontend_bucket_policy" {
  bucket = aws_s3_bucket.raas_frontend_bucket.id
  policy = data.aws_iam_policy_document.raas_front_bucket_policy_document.json

  depends_on = [
    aws_s3_bucket_public_access_block.raas_frontend_bucket
  ]
}


resource "aws_s3_bucket_website_configuration" "raas_frontend" {
  bucket = aws_s3_bucket.raas_frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}
