pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
        COMPOSE_FILE = "${WORKSPACE}/docker-compose-jenkins.yml"
        TEST_REPO = "https://github.com/Romaisa-Munir/bookverse-selenium-tests.git"
    }
    
    stages {
        stage('Checkout Application') {
            steps {
                echo 'Cloning application repository from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Romaisa-Munir/WebTechSemProject.git'
            }
        }
        
        stage('Prepare Environment') {
            steps {
                echo 'Copying docker-compose file...'
                sh '''
                cp /home/ubuntu/jenkins-bookverse/docker-compose-jenkins.yml ${WORKSPACE}/
                '''
            }
        }
        
        stage('Stop Old Containers') {
            steps {
                echo 'Stopping any existing Jenkins containers...'
                sh '''
                cd ${WORKSPACE}
                docker-compose -f docker-compose-jenkins.yml down || true
                '''
            }
        }
        
        stage('Build & Deploy') {
            steps {
                echo 'Starting containers with docker-compose...'
                sh '''
                cd ${WORKSPACE}
                docker-compose -f docker-compose-jenkins.yml up -d
                '''
            }
        }
        
        stage('Import Database') {
            steps {
                echo 'Importing database data...'
                sh '''
                sleep 15
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection books --file /tmp/db_files/BOOKVERSE.books.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection genres --file /tmp/db_files/BOOKVERSE.genres.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection users --file /tmp/db_files/BOOKVERSE.users.json --jsonArray --drop || true
                docker exec jenkins-bookverse-mongodb mongoimport --db bookverse --collection wishlists --file /tmp/db_files/BOOKVERSE.wishlists.json --jsonArray --drop || true
                echo "Waiting for services to stabilize..."
                sleep 10
                '''
            }
        }
        
        stage('Checkout Tests') {
            steps {
                echo 'Cloning test repository...'
                dir('tests') {
                    git branch: 'main',
                        url: "${TEST_REPO}"
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                echo 'Building test Docker image...'
                sh '''
                cd ${WORKSPACE}/tests
                
                # Update BASE_URL in test file to use Jenkins port
                sed -i 's|BASE_URL = "http://13.201.96.168"|BASE_URL = "http://13.201.96.168:8081"|' test_bookverse.py
                
                # Build test image
                docker build -t bookverse-tests:latest -f Dockerfile.test .
                
                echo "Running Selenium tests..."
                # Run tests with host network to access app
                docker run --rm \
                    --network host \
                    bookverse-tests:latest
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying containers are running...'
                sh '''
                docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                echo "Application accessible at http://13.201.96.168:8081"
                echo "All tests passed successfully!"
                '''
            }
        }
    }
    
    post {
        success {
            echo '✓ Pipeline completed successfully! All tests passed.'
        }
        failure {
            echo '✗ Pipeline failed. Check logs for details.'
            sh '''
            echo "=== Application Logs ==="
            docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml logs --tail=50
            '''
        }
        always {
            echo 'Cleaning up test artifacts...'
            sh '''
            docker rmi bookverse-tests:latest || true
            '''
        }
    }
}
