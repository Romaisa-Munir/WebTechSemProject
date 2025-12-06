pipeline {
    agent any
    
    environment {
        WORKSPACE = "${WORKSPACE}"
        COMPOSE_FILE = "${WORKSPACE}/docker-compose-jenkins.yml"
        TEST_REPO = "https://github.com/Romaisa-Munir/bookverse-selenium-tests.git"  // UPDATE THIS!
        APP_URL = "http://13.201.96.168"  // Your deployed application URL
    }
    
    stages {
        stage('Checkout Application Code') {
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
                    sleep 10
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection books \
                        --file /tmp/db_files/BOOKVERSE.books.json \
                        --jsonArray \
                        --drop || true
                    
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection genres \
                        --file /tmp/db_files/BOOKVERSE.genres.json \
                        --jsonArray \
                        --drop || true
                    
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection users \
                        --file /tmp/db_files/BOOKVERSE.users.json \
                        --jsonArray \
                        --drop || true
                    
                    docker exec jenkins-bookverse-mongodb mongoimport \
                        --db bookverse \
                        --collection wishlists \
                        --file /tmp/db_files/BOOKVERSE.wishlists.json \
                        --jsonArray \
                        --drop || true
                '''
            }
        }
        
        stage('Verify Deployment') {
            steps {
                echo 'Verifying containers are running...'
                sh '''
                    docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml ps
                    echo "Application accessible at ${APP_URL}"
                '''
            }
        }
        
        stage('Wait for Application') {
            steps {
                echo 'Waiting for application to be ready...'
                sh '''
                    echo "Waiting 30 seconds for application to start..."
                    sleep 30
                    
                    # Check if application is accessible
                    curl -f ${APP_URL} || echo "Application may still be starting..."
                '''
            }
        }
        
        stage('Checkout Test Code') {
            steps {
                echo 'Cloning test repository...'
                dir('selenium-tests') {
                    git branch: 'main',
                        url: "${TEST_REPO}"
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                echo 'Running Selenium tests in Docker container...'
                script {
                    // Update config.properties with deployed application URL
                    sh '''
                        cd ${WORKSPACE}/selenium-tests
                        
                        # Update the base URL in config.properties to point to deployed app
                        sed -i "s|base.url=.*|base.url=${APP_URL}|g" src/test/resources/config.properties
                        
                        echo "Updated config.properties:"
                        cat src/test/resources/config.properties
                    '''
                    
                    // Run tests in Docker container
                    sh '''
                        cd ${WORKSPACE}/selenium-tests
                        
                        docker run --rm \
                            -v $(pwd):/tests \
                            -w /tests \
                            --network host \
                            markhobson/maven-chrome:latest \
                            mvn clean test
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo 'Archiving test results...'
            junit allowEmptyResults: true, testResults: 'selenium-tests/target/surefire-reports/*.xml'
            
            echo 'Publishing test reports...'
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'selenium-tests/target/surefire-reports',
                reportFiles: '*.html',
                reportName: 'Selenium Test Report'
            ])
        }
        success {
            echo '✅ Pipeline completed successfully! All tests passed!'
        }
        failure {
            echo '❌ Pipeline failed. Check logs for details.'
            sh 'docker-compose -f ${WORKSPACE}/docker-compose-jenkins.yml logs || true'
            sh 'cat ${WORKSPACE}/selenium-tests/target/surefire-reports/*.txt || true'
        }
    }
}
