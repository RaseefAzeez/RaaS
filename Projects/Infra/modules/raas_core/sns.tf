resource "aws_sns_topic" "raas_notification" {
  name = "raas-${var.environment}-notification-topic"
}

resource "aws_sns_topic_subscription" "raas_email_subscription" {
  topic_arn = aws_sns_topic.raas_notification.arn
  protocol  = "email"
  endpoint  = "raseefaz@gmail.com"
}

