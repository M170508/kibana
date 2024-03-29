FROM docker.elastic.co/kibana-ci/kibana-serverless:latest


RUN echo "\n" >> /usr/share/kibana/config/kibana.yml && echo "xpack.securitySolution.enableExperimental=['newUserDetailsFlyoutManagedUser']" >> /usr/share/kibana/config/kibana.yml
