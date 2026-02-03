package microservices.book.multiplication.configuration;

import tools.jackson.databind.JacksonModule;
import tools.jackson.datatype.hibernate7.Hibernate7Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JsonConfiguration {
    @Bean
    public JacksonModule hibernateModule() {
        return new Hibernate7Module();
    }

}
