
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'advaidhb/2048-game'
        AWS_REGION = 'us-east-1'
        EKS_CLUSTER = '2048-eks-cluster'
        K8S_DEPLOYMENT = '2048-deployment'
        K8S_CONTAINER = '2048-container'
    }

    stages {

        stage('Checkout GitHub') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG = env.GIT_COMMIT.take(7)
                    echo "Building image tag: ${env.IMAGE_TAG}"
                }
            }
        }

        stage('Validate Application') {
            steps {
                bat '''
                    if not exist app\\Dockerfile exit /b 1
                    if not exist app\\index.html exit /b 1
                    if not exist app\\game.js exit /b 1
                    if not exist app\\style.css exit /b 1
                    if not exist deployment.yaml exit /b 1
                    echo Application files validated successfully.
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                bat '''
                    docker build -t %DOCKER_IMAGE%:%IMAGE_TAG% .\\app
                '''
            }
        }

        
        stage('Push to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_TOKEN'
                    )
                ]) {
                    bat '''
                    @echo off
                    powershell -NoProfile -NonInteractive -Command "$env:DOCKER_TOKEN | docker login --username $env:DOCKER_USER --password-stdin"
                    if errorlevel 1 exit /b 1

                    docker push %DOCKER_IMAGE%:%IMAGE_TAG%
                    if errorlevel 1 exit /b 1

                    docker logout
                '''
                }
            }
        }


        stage('Connect to AWS EKS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',
                           variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',
                           variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'aws-session-token',
                           variable: 'AWS_SESSION_TOKEN')
                ]) {
                    bat '''
                        aws sts get-caller-identity
                        if errorlevel 1 exit /b 1

                        aws eks update-kubeconfig --region %AWS_REGION% --name %EKS_CLUSTER%
                        if errorlevel 1 exit /b 1

                        kubectl get nodes
                        if errorlevel 1 exit /b 1
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',
                           variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key',
                           variable: 'AWS_SECRET_ACCESS_KEY'),
                    string(credentialsId: 'aws-session-token',
                           variable: 'AWS_SESSION_TOKEN')
                ]) {
                    bat '''
                        kubectl set image deployment/%K8S_DEPLOYMENT% %K8S_CONTAINER%=%DOCKER_IMAGE%:%IMAGE_TAG%
                        if errorlevel 1 exit /b 1

                        kubectl rollout status deployment/%K8S_DEPLOYMENT% --timeout=180s
                        if errorlevel 1 exit /b 1

                        kubectl get pods
                        kubectl get services
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Application deployed to Amazon EKS!'
            echo "Docker image: ${env.DOCKER_IMAGE}:${env.IMAGE_TAG}"
        }

        failure {
            echo 'Pipeline failed. Check the Jenkins console output.'
        }
    }
}
