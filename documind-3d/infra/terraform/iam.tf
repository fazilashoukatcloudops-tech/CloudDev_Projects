data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "${local.name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

data "aws_iam_policy_document" "s3_app" {
  statement {
    sid       = "ObjectAccess"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.files.arn}/*"]
  }
  statement {
    sid       = "BucketHealthCheck"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.files.arn]
  }
}

resource "aws_iam_role_policy" "s3_app" {
  name   = "s3-app-access"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.s3_app.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "app" {
  name = "${local.name}-ec2-profile"
  role = aws_iam_role.app.name
}
