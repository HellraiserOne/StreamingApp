pipeline {
  agent any
  environment {
    AWS_REGION = 'us-east-1'
    ACCOUNT_ID = credentials('aws-account-id') // or hardcode
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Build Images') {
      steps {
        sh '''
          for svc in auth streaming admin chat frontend; do
            docker build -t streamingapp-$svc:1.0.$BUILD_NUMBER -f backend/${svc}Service/Dockerfile . || true
          done
        '''
      }
    }
    stage('Push to ECR') {
      steps {
        withAWS(credentials: 'aws-creds', region: "${AWS_REGION}") {
          sh 'aws ecr get-login-password | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com'
          sh 'docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/streamingapp-auth:1.0.$BUILD_NUMBER'
        }
      }
    }
  }
}